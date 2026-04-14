import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../core/config/env.dart';
import '../../core/services/token_service.dart';
import '../../core/models/api_response.dart';
import 'api_endpoints.dart';

// ─────────────────────────────────────────────
// Abstract Interface
// ─────────────────────────────────────────────

abstract class ApiClient {
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
  });

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  });

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  });

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  });

  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  });

  void setToken(String token);
  void clearToken();
  void setOnLogout(VoidCallback onLogout);
  String? get token;
}

// ─────────────────────────────────────────────
// Production Dio Implementation
// ─────────────────────────────────────────────

class DioApiClient implements ApiClient {
  final Dio _dio;
  final Dio _retryDio;
  final TokenService _tokenService = TokenService();
  static const _uuid = Uuid();

  String? _token;
  VoidCallback? _onLogout;
  Completer<String?>? _refreshCompleter;

  // 15-second global timeout (for mobile network stability)
  static const _timeout = Duration(seconds: 15);

  DioApiClient([this._token])
    : _dio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: _timeout,
          receiveTimeout: _timeout,
          sendTimeout: _timeout,
        ),
      ),
      _retryDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: _timeout,
          receiveTimeout: _timeout,
          sendTimeout: _timeout,
        ),
      ) {
    // Interceptor order: onRequest → onResponse → onError
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        // 1. REQUEST: inject auth, tracing, client headers
        onRequest: (options, handler) async {
          final requestId = _uuid.v4();
          options.extra['requestId'] = requestId;

          final t = _token ?? await _tokenService.getToken();
          if (t != null) options.headers['Authorization'] = 'Bearer $t';

          options.headers['Content-Type'] = 'application/json';
          options.headers['X-Request-Id'] = requestId;
          options.headers['X-Kovari-Client'] = 'mobile';

          return handler.next(options);
        },

        // 2. RESPONSE: log success
        onResponse: (response, handler) {
          return handler.next(response);
        },

        // 3. ERROR: handle 401 refresh, log failures
        onError: (DioException e, handler) async {
          // --- 401 token refresh flow ---
          if (e.response?.statusCode == 401 &&
              !e.requestOptions.path.contains(ApiEndpoints.refresh)) {
            final currentToken = await _tokenService.getToken();
            final requestToken = e.requestOptions.headers['Authorization']
                ?.toString()
                .replaceFirst('Bearer ', '');

            if (currentToken != null && currentToken != requestToken) {
              final options = e.requestOptions;
              options.headers['Authorization'] = 'Bearer $currentToken';
              setToken(currentToken);
              final retryResponse = await _retryDio.request(
                options.path,
                data: options.data,
                queryParameters: options.queryParameters,
                options: Options(
                  method: options.method,
                  headers: options.headers,
                ),
              );
              return handler.resolve(retryResponse);
            }

            if (_refreshCompleter != null) {
              final newToken = await _refreshCompleter!.future;
              if (newToken != null) {
                final options = e.requestOptions;
                options.headers['Authorization'] = 'Bearer $newToken';
                setToken(newToken);
                final retryResponse = await _retryDio.request(
                  options.path,
                  data: options.data,
                  queryParameters: options.queryParameters,
                  options: Options(
                    method: options.method,
                    headers: options.headers,
                  ),
                );
                return handler.resolve(retryResponse);
              }
            }

            _refreshCompleter = Completer<String?>();
            final refreshToken = await _tokenService.getRefreshToken();
            if (refreshToken != null) {
              try {
                final refreshResponse = await _retryDio.post(
                  ApiEndpoints.refresh,
                  data: {'refreshToken': refreshToken},
                );
                if (refreshResponse.statusCode == 200 ||
                    refreshResponse.statusCode == 201) {
                  final newAccessToken = refreshResponse.data['accessToken'];
                  final newRefreshToken = refreshResponse.data['refreshToken'];
                  await _tokenService.saveToken(newAccessToken);
                  await _tokenService.saveRefreshToken(newRefreshToken);
                  setToken(newAccessToken);
                  _refreshCompleter?.complete(newAccessToken);
                  _refreshCompleter = null;
                  final options = e.requestOptions;
                  options.headers['Authorization'] = 'Bearer $newAccessToken';
                  final retryResponse = await _retryDio.request(
                    options.path,
                    data: options.data,
                    queryParameters: options.queryParameters,
                    options: Options(
                      method: options.method,
                      headers: options.headers,
                    ),
                  );
                  return handler.resolve(retryResponse);
                }
              } catch (refreshError) {
                _refreshCompleter?.complete(null);
                _refreshCompleter = null;
                if (refreshError is DioException) {
                  final s = refreshError.response?.statusCode;
                  if (s == 401 || s == 403 || s == 400) {
                    await _tokenService.clearToken();
                    clearToken();
                    _onLogout?.call();
                  }
                }
              }
            } else {
              _refreshCompleter?.complete(null);
              _refreshCompleter = null;
            }
          }

          return handler.next(e);
        },
      ),
    );
  }

  @override
  String? get token => _token;
  @override
  void setToken(String token) => _token = token;
  @override
  void clearToken() => _token = null;
  @override
  void setOnLogout(VoidCallback onLogout) => _onLogout = onLogout;

  // ─────────────────────────────────────────────
  // _safeRequest: centralizes all error handling
  // Converts every response into ApiResponse<T>
  // ─────────────────────────────────────────────
  Future<ApiResponse<T>> _safeRequest<T>(
    Future<Response> Function() request,
    T Function(dynamic) parser,
  ) async {
    String? requestId;
    bool hasRetried = false;

    Future<ApiResponse<T>> execute() async {
      try {
        final response = await request();
        requestId = response.requestOptions.extra['requestId']?.toString();

        // Handle Non-Map JSON responses
        if (response.data != null && response.data is! Map<String, dynamic>) {
          return ApiResponse.fallback(
            reason: 'invalid_format',
            requestId: requestId,
          );
        }

        // 204 / empty body → fallback
        if (response.statusCode == 204 || response.data == null) {
          return ApiResponse.fallback(
            reason: 'empty_body',
            requestId: requestId,
          );
        }

        final rawData = response.data as Map<String, dynamic>;

        // Validate top-level shape (missing 'success' or 'data')
        if (!rawData.containsKey('success') || !rawData.containsKey('data')) {
          return ApiResponse.fallback(
            reason: 'invalid_shape',
            requestId: requestId,
          );
        }

        // Non-2xx → fallback (handled by catch normally, but good to be explicit)
        final status = response.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          return ApiResponse.fallback(
            reason: 'server_error',
            requestId: requestId,
          );
        }

        final parsed = ApiResponse.fromJson(
          rawData,
          parser,
          requestId: requestId,
        );

        return parsed;
      } on DioException catch (e) {
        requestId ??= e.requestOptions.extra['requestId']?.toString();

        final statusCode = e.response?.statusCode ?? 0;
        final isServer5xx = statusCode >= 500 && statusCode < 600;
        final isTransient =
            e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout ||
            e.type == DioExceptionType.sendTimeout ||
            e.type == DioExceptionType.connectionError ||
            isServer5xx;

        // Strict Single Retry Policy
        if (isTransient && !hasRetried) {
          hasRetried = true;
          await Future.delayed(const Duration(milliseconds: 500));
          return execute();
        }

        final reason =
            e.type == DioExceptionType.connectionTimeout ||
                e.type == DioExceptionType.receiveTimeout ||
                e.type == DioExceptionType.sendTimeout
            ? 'timeout'
            : isServer5xx
            ? 'server_error'
            : 'network';

        return ApiResponse.fallback(reason: reason, requestId: requestId);
      } catch (e) {
        return ApiResponse.fallback(reason: 'malformed', requestId: requestId);
      }
    }

    return execute();
  }

  @override
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
  }) {
    return _safeRequest(
      () => _dio.get(path, queryParameters: queryParameters),
      parser,
    );
  }

  @override
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) {
    return _safeRequest(() => _dio.post(path, data: data), parser);
  }

  @override
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) {
    return _safeRequest(() => _dio.put(path, data: data), parser);
  }

  @override
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) {
    return _safeRequest(() => _dio.patch(path, data: data), parser);
  }

  @override
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) {
    return _safeRequest(() => _dio.delete(path, data: data), parser);
  }
}

// ─────────────────────────────────────────────
// Mock Client (development only)
// ─────────────────────────────────────────────

class MockApiClient implements ApiClient {
  String? _token;

  @override
  String? get token => _token;
  @override
  void setToken(String t) => _token = t;
  @override
  void clearToken() => _token = null;
  @override
  void setOnLogout(VoidCallback onLogout) {}

  @override
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-get');
  }

  @override
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-post');
  }

  @override
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-put');
  }

  @override
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-patch');
  }

  @override
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ApiResponse.fallback(reason: 'mock', requestId: 'mock-delete');
  }
}

// ─────────────────────────────────────────────
// Factory + Provider
// ─────────────────────────────────────────────

class ApiClientFactory {
  static ApiClient create({String? token}) {
    if (Env.useMockApi) return MockApiClient();
    return DioApiClient(token);
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClientFactory.create();
});
