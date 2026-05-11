import 'dart:convert';
import 'package:dio/dio.dart';
import 'secure_key_manager.dart';
import '../utils/app_logger.dart';
import 'package:uuid/uuid.dart';

class RequestSigningService {
  final SecureKeyManager _keyManager = SecureKeyManager();

  /// 🖋️ Generates a cryptographic signature for a request.
  Future<Map<String, String>> generateHeaders({
    required String method,
    required String path,
    dynamic body,
  }) async {
    final nonce = const Uuid().v4();
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    
    // Normalize body
    String bodyString = '';
    if (body != null) {
      if (body is Map || body is List) {
        bodyString = jsonEncode(body);
      } else {
        bodyString = body.toString();
      }
    }

    // Payload: METHOD|PATH|TIMESTAMP|NONCE|BODY
    final payload = '$method|$path|$timestamp|$nonce|$bodyString';
    final signature = await _keyManager.signPayload(payload);

    return {
      'X-Nonce': nonce,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'X-Device-Id': _keyManager.deviceTrustId,
    };
  }
}

class RequestSigningInterceptor extends Interceptor {
  final RequestSigningService _signingService = RequestSigningService();

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Only sign mutations (POST, PUT, PATCH, DELETE)
    final mutations = {'POST', 'PUT', 'PATCH', 'DELETE'};
    
    if (mutations.contains(options.method.toUpperCase())) {
      try {
        final headers = await _signingService.generateHeaders(
          method: options.method,
          path: options.path,
          body: options.data,
        );
        options.headers.addAll(headers);
      } catch (e) {
        AppLogger.e('❌ [RequestSigningInterceptor] Failed to sign request: $e');
        // In high-security mode, we might want to block the request here
      }
    }
    
    return handler.next(options);
  }
}
