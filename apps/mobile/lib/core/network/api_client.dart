import 'dart:async';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../core/config/env.dart';
import '../../core/auth/token_storage.dart';
import '../../core/auth/session_manager.dart';
import '../../core/auth/auth_repository.dart';
import '../../core/utils/deep_clone.dart';
import '../../core/models/api_response.dart';
import 'api_endpoints.dart';
import '../utils/app_logger.dart';
import 'request_priority.dart';

// ─────────────────────────────────────────────
// Abstract Interface
// ─────────────────────────────────────────────

abstract class ApiClient {
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  });

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  });

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  });

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  });

  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  });

  void setToken(String token);
  void clearToken();
  void setOnLogout(VoidCallback onLogout);
  void setOnNetworkError(VoidCallback onNetworkError);
  String? get token;
}

// ─────────────────────────────────────────────
// Production Dio Implementation
// ─────────────────────────────────────────────

class DioApiClient implements ApiClient {
  final Dio _dio;
  final Dio _retryDio;
  final SessionManager _sessionManager;
  final TokenStorage _tokenStorage = TokenStorage();
  late final AuthRepository _authRepository;
  final Ref _ref;

  static const _uuid = Uuid();

  DioApiClient(this._ref)
    : _sessionManager = _ref.read(sessionManagerProvider),
      _dio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          sendTimeout: const Duration(seconds: 15),
        ),
      ),
      _retryDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
        ),
      ) {
    _authRepository = _ref.read(authRepositoryProvider);
    _initializeInterceptors();
  }

  void _initializeInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // 1. Traceability: Preserve or generate X-Request-Id
          final requestId = options.headers['X-Request-Id'] ?? _uuid.v4();
          options.headers['X-Request-Id'] = requestId;
          options.extra['requestId'] = requestId;

          // 2. Classification
          final isPublic =
              options.extra['isPublic'] ??
              TokenStorage.isPublicEndpoint(options.path);
          final authRequired = options.extra['authRequired'] ?? !isPublic;
          final isMutation =
              options.extra['isMutation'] ??
              [
                'POST',
                'PUT',
                'PATCH',
                'DELETE',
              ].contains(options.method.toUpperCase());

          options.extra['authRequired'] = authRequired;
          options.extra['isMutation'] = isMutation;

          // 3. Priority Classification
          final priority =
              options.extra[TokenStorage.priorityKey] ??
              (isMutation ? RequestPriority.high : RequestPriority.medium);
          options.extra[TokenStorage.priorityKey] = priority;

          // 3. Mutation Guard for Degraded Mode
          if (authRequired && isMutation && _sessionManager.isDegraded) {
            AppLogger.w(
              '[$requestId] Mutation blocked: App is in Degraded Mode',
            );
            return handler.reject(
              DioException(
                requestOptions: options,
                error: DegradedModeException(),
                type: DioExceptionType.cancel,
              ),
            );
          }

          // 4. Selective Blocking: Only Auth-required requests wait for refresh
          if (authRequired && _sessionManager.isRefreshing) {
            AppLogger.d('[$requestId] Queuing request behind active refresh');
            try {
              await _sessionManager.waitForRefresh(
                priority: priority as RequestPriority,
              );
            } catch (e) {
              return handler.reject(
                DioException(
                  requestOptions: options,
                  error: e,
                  type: DioExceptionType.cancel,
                ),
              );
            }
          }

          // 5. Attach Authorization
          if (authRequired) {
            final token = await _tokenStorage.getAccessToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }

          // 6. Memory-Safe Cancellation Registration
          final cancelToken = options.cancelToken ?? CancelToken();
          options.cancelToken = cancelToken;
          _sessionManager.registerToken(cancelToken);

          options.extra['startTime'] = DateTime.now().millisecondsSinceEpoch;
          _logRequest(options);
          return handler.next(options);
        },
        onResponse: (response, handler) {
          final requestId = response.requestOptions.extra['requestId'] ?? 'N/A';
          final authRequired =
              response.requestOptions.extra['authRequired'] == true;

          // Latency Tracking
          final startTime = response.requestOptions.extra['startTime'] as int?;
          if (startTime != null) {
            _sessionManager.recordLatency(
              DateTime.now().millisecondsSinceEpoch - startTime,
            );
          }

          if (response.requestOptions.cancelToken != null) {
            _sessionManager.unregisterToken(
              response.requestOptions.cancelToken!,
            );
          }

          // 1. Success-based Recovery Reset
          if (authRequired &&
              response.statusCode == 200 &&
              response.requestOptions.extra[TokenStorage.fromCacheKey] !=
                  true) {
            _authRepository.resetRecoveryBudget();
          }

          // 2. Meta Merge for Degraded Mode
          if (_sessionManager.isDegraded &&
              response.data is Map<String, dynamic> &&
              (response.data as Map).containsKey('meta')) {
            final data = response.data as Map<String, dynamic>;
            final existingMeta = data['meta'] as Map<String, dynamic>? ?? {};
            data['meta'] = {...existingMeta, 'degraded': true};
          }

          AppLogger.i(
            '✅ [RES] [$requestId] ${response.requestOptions.method} ${response.requestOptions.path} [${response.statusCode}]',
          );
          return handler.next(response);
        },
        onError: (DioException e, handler) async {
          final requestId = e.requestOptions.extra['requestId'] ?? 'N/A';
          if (e.requestOptions.cancelToken != null) {
            _sessionManager.unregisterToken(e.requestOptions.cancelToken!);
          }

          // 1. 3-Tier 401 Detection
          final is401 = e.response?.statusCode == 401;
          final hasAuthHeader = e.requestOptions.headers.containsKey(
            'Authorization',
          );
          final isTokenExpired = _isTokenExpiredError(e);
          final heuristicExpired = await _tokenStorage.isExpired();

          final shouldRefresh =
              (isTokenExpired) ||
              (is401 && hasAuthHeader) ||
              (heuristicExpired && hasAuthHeader);

          if (shouldRefresh &&
              !e.requestOptions.path.contains(ApiEndpoints.refresh)) {
            // Guard against infinite retry loops
            if (e.requestOptions.extra['retry'] == true ||
                (e.requestOptions.extra['retryCount'] as int? ?? 0) >= 1) {
              AppLogger.e(
                '❌ [$requestId] Retry limit exceeded for 401. Forcing logout.',
              );
              await _authRepository.logout(reason: 'RETRY_LIMIT_EXCEEDED');
              return handler.next(e);
            }

            AppLogger.w(
              '⚠️ [$requestId] 401 Detected (Code: $isTokenExpired, Status: $is401, Heuristic: $heuristicExpired). Attempting refresh.',
            );

            try {
              await _authRepository.refreshToken(requestId: requestId);

              // 2. Post-Refresh Retry with Jittered Exponential Backoff
              final retryCount =
                  (e.requestOptions.extra['retryCount'] as int? ?? 0) + 1;
              final backoffMs =
                  (pow(2, retryCount) * 100).toInt() + Random().nextInt(100);
              await Future.delayed(Duration(milliseconds: backoffMs));

              return handler.resolve(
                await _retryRequest(e.requestOptions, retryCount),
              );
            } catch (refreshError) {
              return handler.reject(
                DioException(
                  requestOptions: e.requestOptions,
                  error: refreshError,
                  type: DioExceptionType.cancel,
                ),
              );
            }
          }

          AppLogger.e(
            '❌ [ERR] [$requestId] ${e.requestOptions.method} ${e.requestOptions.path} [${e.response?.statusCode}]',
            error: e,
          );
          return handler.next(e);
        },
      ),
    );
  }

  bool _isTokenExpiredError(DioException e) {
    if (e.response?.data is Map) {
      final data = e.response!.data as Map;
      final code = data['error']?['code'] ?? data['code'];
      return code == 'TOKEN_EXPIRED';
    }
    return false;
  }

  Future<Response> _retryRequest(
    RequestOptions originalOptions,
    int retryCount,
  ) async {
    // Industrial-Grade Deep Clone
    final options = Options(
      method: originalOptions.method,
      headers: Map<String, dynamic>.from(originalOptions.headers),
      extra: Map<String, dynamic>.from(originalOptions.extra),
      contentType: originalOptions.contentType,
      responseType: originalOptions.responseType,
      validateStatus: originalOptions.validateStatus,
    );

    options.extra!['retryCount'] = retryCount;
    options.extra!['retry'] = true;

    // Attach new token
    final newToken = await _tokenStorage.getAccessToken();
    if (newToken != null) {
      options.headers!['Authorization'] = 'Bearer $newToken';
    }

    // Preserve X-Request-Id
    final requestId = originalOptions.extra['requestId'];

    AppLogger.i('🔄 [$requestId] Retrying request (Attempt #$retryCount)');

    return _retryDio.request(
      originalOptions.path,
      data: originalOptions.data,
      queryParameters: originalOptions.queryParameters,
      options: options,
      cancelToken: originalOptions.cancelToken,
    );
  }

  void _logRequest(RequestOptions options) {
    final requestId = options.extra['requestId'] ?? 'N/A';

    // Immutable Deep Sanitization
    dynamic sanitizedData;
    Map<String, dynamic>? sanitizedHeaders;
    Map<String, dynamic>? sanitizedParams;

    if (options.data is FormData) {
      sanitizedData = '[FORMDATA_SKIPPED]';
    } else if (!_sessionManager.isBinaryPayload(options.data)) {
      sanitizedData = _redactSensitiveData(deepClone(options.data));
    } else {
      sanitizedData = '[BINARY_DATA_SKIPPED]';
    }

    final redactedHeaders = _redactSensitiveData(deepClone(options.headers));
    if (redactedHeaders is Map) {
      sanitizedHeaders = Map<String, dynamic>.from(redactedHeaders);
    }

    final redactedParams = _redactSensitiveData(
      deepClone(options.queryParameters),
    );
    if (redactedParams is Map) {
      sanitizedParams = Map<String, dynamic>.from(redactedParams);
    }

    AppLogger.i('➡️ [REQ] [$requestId] ${options.method} ${options.uri}');
  }

  dynamic _redactSensitiveData(dynamic data) {
    if (data == null) return null;
    if (data is Map) {
      final keysToRedact = {
        'authorization',
        'accessToken',
        'refreshToken',
        'email',
        'phone',
        'latitude',
        'longitude',
        'password',
      };
      return data.map((key, value) {
        if (keysToRedact.contains(key.toString().toLowerCase())) {
          return MapEntry(key, '[REDACTED]');
        }
        return MapEntry(key, _redactSensitiveData(value));
      });
    } else if (data is List) {
      return data.map((e) => _redactSensitiveData(e)).toList();
    }
    return data;
  }

  @override
  String? get token => null; // Use TokenStorage directly
  @override
  void setToken(String token) {}
  @override
  void clearToken() {}
  @override
  void setOnLogout(VoidCallback onLogout) {}
  @override
  void setOnNetworkError(VoidCallback onNetworkError) {}

  @override
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) {
    return _safeRequest(
      () => _dio.get(
        path,
        queryParameters: queryParameters,
        cancelToken: cancelToken,
      ),
      parser,
    );
  }

  @override
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) {
    return _safeRequest(
      () => _dio.post(path, data: data, cancelToken: cancelToken),
      parser,
    );
  }

  @override
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) {
    return _safeRequest(
      () => _dio.put(path, data: data, cancelToken: cancelToken),
      parser,
    );
  }

  @override
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) {
    return _safeRequest(
      () => _dio.patch(path, data: data, cancelToken: cancelToken),
      parser,
    );
  }

  @override
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) {
    return _safeRequest(
      () => _dio.delete(path, data: data, cancelToken: cancelToken),
      parser,
    );
  }

  Future<ApiResponse<T>> _safeRequest<T>(
    Future<Response> Function() request,
    T Function(dynamic) parser,
  ) async {
    try {
      final response = await request();
      final requestId = response.requestOptions.extra['requestId']?.toString();

      if (response.data == null || response.data is! Map) {
        return ApiResponse.fallback(
          reason: 'invalid_format',
          requestId: requestId,
        );
      }

      return ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        parser,
        requestId: requestId,
      );
    } on DioException catch (e) {
      final requestId = e.requestOptions.extra['requestId']?.toString();

      if (e.error is DegradedModeException ||
          e.error is RefreshTimeoutException ||
          e.error is TooManyRequestsException ||
          e.error is AuthFailure) {
        return ApiResponse.fallback(
          reason: e.error.toString(),
          requestId: requestId,
        );
      }

      String reason = 'network';
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        reason = 'timeout';
      }

      return ApiResponse.fallback(reason: reason, requestId: requestId);
    } catch (e) {
      return ApiResponse.fallback(reason: 'malformed');
    }
  }
}

// ─────────────────────────────────────────────
// Mock Client (development only)
// ─────────────────────────────────────────────

class MockApiClient implements ApiClient {
  @override
  String? get token => null;
  @override
  void setToken(String t) {}
  @override
  void clearToken() {}
  @override
  void setOnLogout(VoidCallback onLogout) {}
  @override
  void setOnNetworkError(VoidCallback onNetworkError) {}

  @override
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-get');
  }

  @override
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-post');
  }

  @override
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-put');
  }

  @override
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-patch');
  }

  @override
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
    CancelToken? cancelToken,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-delete');
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  if (Env.useMockApi) return MockApiClient();
  return DioApiClient(ref);
});
