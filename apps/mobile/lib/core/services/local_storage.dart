import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocalStorage {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _userKey = 'user_data';

  /// Save token securely
  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  /// Retrieve token from secure storage
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  /// Clear all stored auth data (Logout)
  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
  
  /// Save user data as string (placeholder for JSON)
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _storage.write(key: _userKey, value: jsonEncode(userData));
  }

  static Future<void> saveUserIds(String clerkId, String uuid) async {
    await _storage.write(key: "clerkId", value: clerkId);
    await _storage.write(key: "uuid", value: uuid);
  }
}
