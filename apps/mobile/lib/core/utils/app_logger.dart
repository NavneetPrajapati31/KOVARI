import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

class AppLogger {
  static const bool _isRelease = kReleaseMode;

  /// Redacts sensitive information from log messages
  static String _redact(String message) {
    if (message.isEmpty) return message;

    // Redact JWT tokens (ey...)
    var redacted = message.replaceAll(
      RegExp(r'ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'),
      '[REDACTED_JWT]',
    );

    // Redact bearer tokens
    redacted = redacted.replaceAll(
      RegExp('Bearer\\s+[^\\s"\'\\\\]+'),
      'Bearer [REDACTED_TOKEN]',
    );

    // Redact sensitive string JSON keys
    redacted = redacted.replaceAllMapped(
      RegExp(r'"(password|accessToken|refreshToken|idToken|otp|cookie|phone)"\s*:\s*"[^"]+"', caseSensitive: false),
      (match) => '"${match.group(1)}":"[REDACTED]"',
    );

    // Redact sensitive numeric/boolean/unquoted JSON keys (like lat, lng)
    redacted = redacted.replaceAllMapped(
      RegExp(r'"(lat|latitude|lng|longitude|phone)"\s*:\s*[-0-9.]+', caseSensitive: false),
      (match) => '"${match.group(1)}":"[REDACTED]"',
    );

    // Redact HTTP headers (Authorization, Cookie)
    redacted = redacted.replaceAll(
      RegExp(r'(Authorization|Cookie)\s*:\s*.*', caseSensitive: false),
      r'$1: [REDACTED]',
    );

    return redacted;
  }

  /// Detailed verbose debug logging
  static void d(String message, {Object? error, StackTrace? stackTrace}) {
    if (_isRelease) return; // Ignore in release
    final redacted = _redact(message);
    debugPrint('🐛 [DEBUG] $redacted');
    if (error != null) debugPrint('    Error: $error');
    if (stackTrace != null) debugPrint('    Stack: $stackTrace');
  }

  /// Informational logs
  static void i(String message) {
    if (_isRelease) return; // Ignore in release
    debugPrint('ℹ️ [INFO] ${_redact(message)}');
  }

  /// Warning logs (always printed, local only)
  static void w(String message, {Object? error, StackTrace? stackTrace}) {
    final redacted = _redact(message);
    debugPrint('⚠️ [WARN] $redacted');
    if (error != null) debugPrint('    Error: $error');
    // Deliberately NOT sent to Sentry to reduce noise/quota drain
  }

  /// Error logs (always printed, optionally sent to Sentry in release)
  static void e(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    bool reportToSentry = true,
  }) {
    final redacted = _redact(message);
    debugPrint('❌ [ERROR] $redacted');
    if (error != null) debugPrint('    Error: $error');
    if (stackTrace != null) debugPrint('    Stack: $stackTrace');

    if (_isRelease && reportToSentry) {
      // Create a simple fingerprint based on the error type and a trimmed message
      final fingerprint = <String>[
        error?.runtimeType.toString() ?? 'Exception',
        redacted.split(':').first, // Use prefix of message to group
      ];

      Sentry.captureException(
        error ?? Exception(redacted),
        stackTrace: stackTrace,
        hint: Hint.withMap({'message': redacted}),
        withScope: (scope) {
          scope.fingerprint = fingerprint;
        },
      );
    }
  }
}
