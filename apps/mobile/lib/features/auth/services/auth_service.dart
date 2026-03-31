import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/local_storage.dart';
import '../../../shared/models/kovari_user.dart';
import '../../../core/network/api_endpoints.dart';

class AuthService {
  final ApiClient _apiClient;
  final LocalStorage _storage;
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  AuthService(this._apiClient, this._storage);

  /// Handle Google Sign-In SSO
  Future<KovariUser?> loginWithGoogle() async {
    try {
      // In 7.x+, authenticate() returns the account.
      // authentication getter is no longer a Future.
      final account = await _googleSignIn.authenticate();
      final GoogleSignInAuthentication auth = account.authentication;
      final String? idToken = auth.idToken;

      if (idToken == null) {
        throw Exception("Failed to retrieve Google ID Token");
      }

      // Step 2: Send idToken to backend
      final response = await _apiClient.post(
        ApiEndpoints.googleAuth,
        data: {'idToken': idToken},
      );

      return _handleAuthResponse(response.data);
    } catch (e) {
      debugPrint('❌ Google Login failed: $e');
      rethrow;
    }
  }

  /// Handle custom Email/Password Login
  Future<KovariUser?> loginWithEmail(String email, String password) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.emailLogin,
        data: {'email': email, 'password': password},
      );

      return _handleAuthResponse(response.data);
    } catch (e) {
      debugPrint('❌ Email Login failed: $e');
      rethrow;
    }
  }

  /// Handle custom Email/Password Registration
  Future<KovariUser?> registerWithEmail(
    String email,
    String password, {
    String? name,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.emailRegister,
        data: {'email': email, 'password': password, 'name': ?name},
      );

      return _handleAuthResponse(response.data);
    } catch (e) {
      debugPrint('❌ Registration failed: $e');
      rethrow;
    }
  }

  /// Request Password Reset via Email
  Future<void> requestPasswordReset(String email) async {
    try {
      await _apiClient.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email},
      );
    } catch (e) {
      debugPrint('❌ Forgot Password request failed: $e');
      rethrow;
    }
  }

  /// Reset Password with token
  Future<void> resetPassword(String token, String newPassword) async {
    try {
      await _apiClient.post(
        ApiEndpoints.resetPassword,
        data: {'token': token, 'newPassword': newPassword},
      );
    } catch (e) {
      debugPrint('❌ Reset Password failed: $e');
      rethrow;
    }
  }
  Future<KovariUser> _handleAuthResponse(dynamic data) async {
    final Map<String, dynamic> responseData = data as Map<String, dynamic>;

    final accessToken = responseData['accessToken'] as String;
    final refreshToken = responseData['refreshToken'] as String;
    final userMap = responseData['user'] as Map<String, dynamic>;

    // 1. Store tokens securely
    await _storage.saveAccessToken(accessToken);
    await _storage.saveRefreshToken(refreshToken);

    // 2. Map user
    final user = KovariUser.fromAuthResponse(userMap);
    await _storage.saveUserData(user.toJson());

    // 3. Update ApiClient
    _apiClient.setToken(accessToken);

    return user;
  }

  /// Restore session from storage
  Future<KovariUser?> checkSession() async {
    final token = await _storage.getAccessToken();
    if (token == null) return null;

    final userData = await _storage.getUserData();
    if (userData == null) return null;

    // Inject token back into client
    _apiClient.setToken(token);

    return KovariUser.fromJson(userData);
  }

  /// Logout and clear all storage
  Future<void> logout() async {
    try {
      // 1. Invalidate session on server-side
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null) {
        // Use best-effort logout call
        await _apiClient.post(
          ApiEndpoints.logout, 
          data: {'refreshToken': refreshToken},
        ).timeout(const Duration(seconds: 3));
      }

      // 2. Clear Google Session
      await _googleSignIn.signOut();
    } catch (e) {
      debugPrint('ℹ️ Logout cleanup (server or Google): $e');
    } 

    // 3. Wipe local state
    _apiClient.clearToken();
    await _storage.clear();
  }
}
