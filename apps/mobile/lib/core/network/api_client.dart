import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../core/config/env.dart';
import '../../core/services/token_service.dart';

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
  String? _token;

  DioApiClient([this._token])
      : _dio = Dio(BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        )) {
    
    // Add custom debug logging interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenService.getToken();

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
          print('✅ [API RESPONSE] ${response.statusCode} ${response.requestOptions.path}');
        }
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        if (kDebugMode) {
          print('❌ [API ERROR] ${e.response?.statusCode} ${e.requestOptions.path}');
          print('Message: ${e.message}');
        }
        return handler.next(e);
      },
    ));
    
    // Add global error handler interceptor (optional refinement)
    _dio.interceptors.add(InterceptorsWrapper(
      onError: (DioException e, handler) {
        // Here we could handle 401 Unauthorized globally if needed (auto-logout)
        return handler.next(e); 
      },
    ));
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
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    await Future.delayed(delay);
    
    if (path == 'users/me') {
      return Response(
        requestOptions: RequestOptions(path: path),
        data: {
          'clerkId': 'user_mock_123',
          'supabaseUuid': '550e8400-e29b-41d4-a716-446655440000',
        },
        statusCode: 200,
      );
    }
    
    return Response(
      requestOptions: RequestOptions(path: path),
      data: {'message': 'Mock data for $path', 'token_received': _token != null},
      statusCode: 200,
    );
  }

  @override
  Future<Response> post(String path, {dynamic data}) async {
    await Future.delayed(delay);
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
