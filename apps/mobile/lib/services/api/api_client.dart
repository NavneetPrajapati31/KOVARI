import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../../core/utils/api_exceptions.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final http.Client _client = http.Client();

  Uri _buildUri(String endpoint) {
    final cleanPath = endpoint.startsWith('/')
        ? endpoint.substring(1)
        : endpoint;
    final baseUrl = ApiConstants.baseUrl;
    final fullUrl = baseUrl.endsWith('/')
        ? '$baseUrl$cleanPath'
        : '$baseUrl/$cleanPath';
    return Uri.parse(fullUrl);
  }

  Map<String, String> _buildHeaders(Map<String, String>? extraHeaders) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?extraHeaders,
    };
  }

  Future<dynamic> get(String endpoint, {Map<String, String>? headers}) async {
    return _request(
      () => _client.get(_buildUri(endpoint), headers: _buildHeaders(headers)),
    );
  }

  Future<dynamic> post(
    String endpoint,
    Map<String, dynamic> body, {
    Map<String, String>? headers,
  }) async {
    return _request(
      () => _client.post(
        _buildUri(endpoint),
        headers: _buildHeaders(headers),
        body: jsonEncode(body),
      ),
    );
  }

  Future<dynamic> put(
    String endpoint,
    Map<String, dynamic> body, {
    Map<String, String>? headers,
  }) async {
    return _request(
      () => _client.put(
        _buildUri(endpoint),
        headers: _buildHeaders(headers),
        body: jsonEncode(body),
      ),
    );
  }

  Future<dynamic> delete(
    String endpoint, {
    Map<String, String>? headers,
  }) async {
    return _request(
      () =>
          _client.delete(_buildUri(endpoint), headers: _buildHeaders(headers)),
    );
  }

  Future<dynamic> _request(Future<http.Response> Function() requestFn) async {
    try {
      final response = await requestFn().timeout(
        const Duration(milliseconds: ApiConstants.connectTimeout),
      );
      _logRequest(response);
      return _processResponse(response);
    } on SocketException catch (e) {
      throw NetworkException(e.message);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  dynamic _processResponse(http.Response response) {
    final int statusCode = response.statusCode;
    final dynamic body = _tryParseJson(response.body);

    if (statusCode >= 200 && statusCode < 300) {
      return body;
    }

    final String message =
        _extractMessage(body) ?? 'Request failed with status: $statusCode';

    switch (statusCode) {
      case 401:
        throw UnauthorizedException(message);
      case 404:
        throw NotFoundException(message);
      default:
        throw ApiException(message, statusCode: statusCode);
    }
  }

  dynamic _tryParseJson(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } catch (_) {
      return body;
    }
  }

  String? _extractMessage(dynamic body) {
    if (body is Map) {
      return body['message'] ?? body['error'] ?? body['msg'];
    }
    return null;
  }

  void _logRequest(http.Response response) {
    if (kDebugMode) {
      debugPrint('--> ${response.request?.method} ${response.request?.url}');
      debugPrint('Status: ${response.statusCode}');
      if (response.body.isNotEmpty) {
        debugPrint('Response: ${response.body}');
      }
      debugPrint('<-- END ${response.request?.method}');
    }
  }

  void dispose() {
    _client.close();
  }
}
