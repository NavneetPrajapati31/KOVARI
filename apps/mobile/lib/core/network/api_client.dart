import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../core/config/env.dart';
import '../../core/services/token_service.dart';
import 'api_endpoints.dart';

/// Base API client interface
abstract class ApiClient {
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters});
  Future<Response> post(String path, {dynamic data});
  Future<Response> patch(String path, {dynamic data});
  Future<Response> delete(String path, {dynamic data});

  /// Dynamically update the authentication token
  void setToken(String token);

  /// Clear the current authentication token (Logout)
  void clearToken();

  /// Access the current token state
  String? get token;
}

/// Production implementation using Dio
class DioApiClient implements ApiClient {
  final Dio _dio;
  final TokenService _tokenService = TokenService();
  String? _token;

  DioApiClient([this._token])
    : _dio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      ) {
    // We use QueuedInterceptorsWrapper to handle concurrent 401s properly
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = _token ?? await _tokenService.getToken();

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          options.headers['Content-Type'] = 'application/json';

          if (kDebugMode) {
            print('🚀 [API REQUEST] ${options.method} ${options.uri}');
          }

          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            print(
              '✅ [API RESPONSE] ${response.statusCode} ${response.requestOptions.path}',
            );
          }
          return handler.next(response);
        },
        onError: (DioException e, handler) async {
          if (kDebugMode) {
            print(
              '❌ [API ERROR] ${e.response?.statusCode} ${e.requestOptions.path}',
            );
          }

          // Handle 401 Unauthorized (Expired Tokens)
          if (e.response?.statusCode == 401 &&
              !e.requestOptions.path.contains(ApiEndpoints.refresh)) {
            final refreshToken = await _tokenService.getRefreshToken();

            if (refreshToken != null) {
              try {
                if (kDebugMode)
                  print('🔄 [AUTH] Attempting silent token refresh...');

                // 1. Request new tokens from backend
                // Use a separate Dio instance for refresh to avoid interceptor recursion
                final refreshDio = Dio(BaseOptions(baseUrl: Env.apiBaseUrl));
                final refreshResponse = await refreshDio.post(
                  ApiEndpoints.refresh,
                  data: {'refreshToken': refreshToken},
                );

                if (refreshResponse.statusCode == 200 ||
                    refreshResponse.statusCode == 201) {
                  final newAccessToken = refreshResponse.data['accessToken'];
                  final newRefreshToken = refreshResponse.data['refreshToken'];

                  // 2. Persist new tokens
                  await _tokenService.saveToken(newAccessToken);
                  await _tokenService.saveRefreshToken(newRefreshToken);
                  setToken(newAccessToken);

                  if (kDebugMode)
                    print(
                      '✨ [AUTH] Token refreshed successfully. Retrying request...',
                    );

                  // 3. Retry original request with new token
                  final options = e.requestOptions;
                  options.headers['Authorization'] = 'Bearer $newAccessToken';

                  final retryResponse = await _dio.request(
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
                if (kDebugMode)
                  print('🚨 [AUTH] Refresh failed: $refreshError');
                // Refresh failed (e.g. refresh token also expired)
                await _tokenService.clearToken();
                clearToken();
              }
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
  void setToken(String token) {
    _token = token;
  }

  @override
  void clearToken() {
    _token = null;
  }

  @override
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  @override
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  @override
  Future<Response> patch(String path, {dynamic data}) {
    return _dio.patch(path, data: data);
  }

  @override
  Future<Response> delete(String path, {dynamic data}) {
    return _dio.delete(path, data: data);
  }
}

/// Mock implementation for local development without backend
class MockApiClient implements ApiClient {
  final Duration delay;
  String? _token;

  MockApiClient({this.delay = const Duration(milliseconds: 500)});

  @override
  String? get token => _token;

  @override
  void setToken(String token) {
    _token = token;
  }

  @override
  void clearToken() {
    _token = null;
  }

  @override
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    await Future.delayed(delay);

    if (path == 'users/me') {
      return Response(
        requestOptions: RequestOptions(path: path),
        data: {
          'id': 'mock_user_123',
          'email': 'mock@example.com',
          'name': 'Mock User',
        },
        statusCode: 200,
      );
    }

    return Response(
      requestOptions: RequestOptions(path: path),
      data: {
        'message': 'Mock data for $path',
        'token_received': _token != null,
      },
      statusCode: 200,
    );
  }

  @override
  Future<Response> post(String path, {dynamic data}) async {
    await Future.delayed(delay);

    if (path.contains('auth')) {
      return Response(
        requestOptions: RequestOptions(path: path),
        data: {
          'accessToken': 'mock_access_token',
          'refreshToken': 'mock_refresh_token',
          'user': {
            'id': 'mock_user_123',
            'email': data['email'] ?? 'mock@example.com',
            'name': data['name'] ?? 'Mock User',
          },
        },
        statusCode: 201,
      );
    }

    return Response(
      requestOptions: RequestOptions(path: path),
      data: {'success': true},
      statusCode: 201,
    );
  }

  @override
  Future<Response> patch(String path, {dynamic data}) async {
    await Future.delayed(delay);
    return Response(
      requestOptions: RequestOptions(path: path),
      data: {'success': true},
      statusCode: 200,
    );
  }

  @override
  Future<Response> delete(String path, {dynamic data}) async {
    await Future.delayed(delay);
    return Response(
      requestOptions: RequestOptions(path: path),
      data: {'success': true},
      statusCode: 200,
    );
  }
}

/// Factory to get the appropriate API client
class ApiClientFactory {
  static ApiClient create({String? token, bool forceReal = false}) {
    if (Env.useMockApi && !forceReal) {
      return MockApiClient();
    }
    return DioApiClient(token);
  }
}
