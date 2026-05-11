import 'package:flutter/foundation.dart';

class TelemetryPrivacyAudit {
  /// Regular expressions for common PII patterns.
  static final RegExp _emailRegex = RegExp(
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
  );
  static final RegExp _tokenRegex = RegExp(
    r'ey[a-zA-Z0-9-_]+\.ey[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+',
  ); // JWT-like
  static final RegExp _authHeaderRegex = RegExp(r'Bearer\s+[a-zA-Z0-9-_.]+');

  /// 🛡️ Scans a payload for potential PII leakage.
  /// Only runs in debug mode. Returns true if the payload is safe.
  static bool isSafe(Map<String, dynamic> payload) {
    if (!kDebugMode) return true;

    final payloadString = payload.toString();

    bool hasEmail = _emailRegex.hasMatch(payloadString);
    bool hasToken =
        _tokenRegex.hasMatch(payloadString) ||
        _authHeaderRegex.hasMatch(payloadString);

    if (hasEmail || hasToken) {
      debugPrint('🚨 [TelemetryPrivacyAudit] PII Leak detected in payload!');
      debugPrint('🔍 Violated Payload: $payloadString');
      return false;
    }

    return true;
  }

  /// 🧹 Recursively scrubs PII from a dynamic object.
  static dynamic scrub(dynamic data) {
    if (data is Map) {
      return data.map<String, dynamic>((key, value) {
        final stringKey = key.toString();
        if (_isSensitiveKey(stringKey)) {
          return MapEntry(stringKey, '[REDACTED]');
        }
        return MapEntry(stringKey, scrub(value));
      });
    } else if (data is List) {
      return data.map((e) => scrub(e)).toList();
    } else if (data is String) {
      return _scrubString(data);
    }
    return data;
  }

  static bool _isSensitiveKey(String key) {
    final sensitiveKeys = {
      'email',
      'password',
      'token',
      'auth',
      'authorization',
      'lat',
      'lon',
      'latitude',
      'longitude',
      'coordinate',
      'phone',
      'address',
      'cookie',
      'secret',
      'key',
    };
    return sensitiveKeys.any((s) => key.toLowerCase().contains(s));
  }

  static String _scrubString(String value) {
    var scrubbed = value;
    scrubbed = scrubbed.replaceAll(_emailRegex, '[EMAIL_REDACTED]');
    scrubbed = scrubbed.replaceAll(_tokenRegex, '[TOKEN_REDACTED]');
    scrubbed = scrubbed.replaceAll(_authHeaderRegex, '[AUTH_REDACTED]');
    return scrubbed;
  }
}
