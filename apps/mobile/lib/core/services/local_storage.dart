import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocalStorage {
  static const _storage = FlutterSecureStorage();
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';

  static const _rememberMeKey = 'remember_me_preference';
  static const _rememberedEmailKey = 'remembered_email';

  /// Save access token securely
  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  /// Retrieve access token from secure storage
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  /// Save refresh token securely
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  /// Retrieve refresh token from secure storage
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  /// Clear all stored auth data (Logout)
  Future<void> clear() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userKey);
    // Note: We don't clear the remembered email/preference on logout,
    // as those are meant to persist for the next login.
  }

  /// Save user data as string
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _storage.write(key: _userKey, value: jsonEncode(userData));
  }

  /// Retrieve user data
  Future<Map<String, dynamic>?> getUserData() async {
    final data = await _storage.read(key: _userKey);
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  /// Save "Remember Me" preference
  Future<void> saveRememberMe(bool value) async {
    await _storage.write(key: _rememberMeKey, value: value.toString());
  }

  /// Get "Remember Me" preference
  Future<bool> getRememberMe() async {
    final val = await _storage.read(key: _rememberMeKey);
    return val == 'true';
  }

  /// Save email for "Remember Me"
  Future<void> saveRememberedEmail(String email) async {
    await _storage.write(key: _rememberedEmailKey, value: email);
  }

  /// Get saved email
  Future<String?> getRememberedEmail() async {
    return await _storage.read(key: _rememberedEmailKey);
  }

  /// Clear saved email
  Future<void> clearRememberedEmail() async {
    await _storage.delete(key: _rememberedEmailKey);
  }

  /// Backward compatibility (optional but recommended for main.dart)
  Future<String?> getToken() => getAccessToken();
  Future<void> saveToken(String token) => saveAccessToken(token);
}
