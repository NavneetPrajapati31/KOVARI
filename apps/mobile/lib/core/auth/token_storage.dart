import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/app_logger.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage();
  
  static const _accessTokenKey = 'kovari_access_token';
  static const _refreshTokenKey = 'kovari_refresh_token';
  static const _expiryKey = 'kovari_token_expiry';
  static const _userKey = 'kovari_user_data';

  // Constants for request classification
  static const fromCacheKey = '__fromCache';
  static const priorityKey = '__priority';

  // Public Endpoints for auto-detection
  static const List<String> _publicEndpoints = [
    'auth/login',
    'auth/register',
    'auth/verify-otp',
    'auth/resend-otp',
    'auth/forgot-password',
    'auth/reset-password',
    'auth/google',
    'health',
  ];

  /// Normalizes path by removing query params and trailing slashes
  static String normalizePath(String path) {
    var normalized = path.split('?').first;
    if (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1);
    }
    if (normalized.startsWith('/')) {
      normalized = normalized.substring(1);
    }
    return normalized;
  }

  static bool isPublicEndpoint(String path) {
    final normalized = normalizePath(path);
    return _publicEndpoints.any((endpoint) => normalized == endpoint);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required int expiryTimestamp,
  }) async {
    try {
      await Future.wait([
        _storage.write(key: _accessTokenKey, value: accessToken),
        _storage.write(key: _refreshTokenKey, value: refreshToken),
        _storage.write(key: _expiryKey, value: expiryTimestamp.toString()),
      ]);
    } catch (e) {
      AppLogger.e('Failed to save tokens to secure storage', error: e);
      rethrow;
    }
  }

  Future<String?> getAccessToken() async => await _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() async => await _storage.read(key: _refreshTokenKey);
  
  Future<int?> getExpiry() async {
    final val = await _storage.read(key: _expiryKey);
    return val != null ? int.tryParse(val) : null;
  }

  Future<bool> isExpired() async {
    final expiry = await getExpiry();
    if (expiry == null) return true;
    return DateTime.now().millisecondsSinceEpoch > expiry;
  }

  Future<bool> isExpiringSoon() async {
    final expiry = await getExpiry();
    if (expiry == null) return true;
    // Expiring within 5 minutes
    return DateTime.now().millisecondsSinceEpoch + (5 * 60 * 1000) > expiry;
  }

  Future<bool> isSeverelyExpired() async {
    final expiry = await getExpiry();
    if (expiry == null) return true;
    // Expired more than 15 minutes ago
    return DateTime.now().millisecondsSinceEpoch > expiry + (15 * 60 * 1000);
  }

  Future<void> clear() async {
    try {
      await Future.wait([
        _storage.delete(key: _accessTokenKey),
        _storage.delete(key: _refreshTokenKey),
        _storage.delete(key: _expiryKey),
        _storage.delete(key: _userKey),
      ]);
    } catch (e) {
      AppLogger.e('Failed to clear secure storage', error: e);
    }
  }

  // User data storage (legacy support if needed)
  Future<void> saveUserData(String userDataJson) async {
    await _storage.write(key: _userKey, value: userDataJson);
  }

  Future<String?> getUserData() async => await _storage.read(key: _userKey);
}
