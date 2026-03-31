class Env {
  // Use String.fromEnvironment for sensitive values to keep them out of source control.
  // Provide these values via --dart-define=KEY=VALUE during build/run.
  
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.39.98:3000/api/',
  );
  
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'ws://kovari.in/socket',
  );

  static const String geoapifyKey = String.fromEnvironment('GEOAPIFY_KEY');

  // Google OAuth - REQUIRED for Mobile Auth
  static const String googleClientId = String.fromEnvironment('GOOGLE_CLIENT_ID');
  static const String googleClientSecret = String.fromEnvironment('GOOGLE_CLIENT_SECRET');

  // Toggle for mock data
  static const bool useMockApi = bool.fromEnvironment('USE_MOCK_API', defaultValue: false);
}
