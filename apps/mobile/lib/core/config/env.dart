import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  /// Internal helper to get a required variable or throw
  static String _getRequired(String key) {
    final value = dotenv.maybeGet(key);
    if (value == null || value.isEmpty) {
      throw Exception(
        'Environment variable $key is missing. Please check your .env file.',
      );
    }
    return value;
  }

  /// Internal helper for optional values
  static String? _getOptional(String key) {
    final value = dotenv.maybeGet(key);
    return (value?.isEmpty ?? true) ? null : value;
  }

  // API & Backend
  static String get apiBaseUrl => _getRequired('API_BASE_URL');
  static String get socketUrl => _getRequired('SOCKET_URL');

  // Third Party
  static String? get geoapifyKey => _getOptional('GEOAPIFY_KEY');

  // Google OAuth - REQUIRED for Mobile Auth
  static String? get googleClientId => _getOptional('GOOGLE_CLIENT_ID');
  static String? get googleClientSecret => _getOptional('GOOGLE_CLIENT_SECRET');

  // Toggle for mock data
  static bool get useMockApi =>
      dotenv.get('USE_MOCK_API', fallback: 'false').toLowerCase() == 'true';

  /// Validates that all critical environment variables are present.
  static void validate() {
    // These will throw if missing during access, but we can pre-check them here.
    _getRequired('API_BASE_URL');
    _getRequired('SOCKET_URL');
  }

  /// Returns the current loaded environment file name for debugging
  static String get currentEnv => const String.fromEnvironment(
    'ENV_FILE',
    defaultValue: '.env.development',
  );
}
