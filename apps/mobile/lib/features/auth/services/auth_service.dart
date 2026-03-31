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

  /// Handle custom Email/Password Registration (Initial Step)
  /// Returns a Map containing {'verificationRequired': true} or the user data
  Future<Map<String, dynamic>> registerWithEmail(
    String email,
    String password, {
    String? name,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.emailRegister,
        data: {'email': email, 'password': password, 'name': name},
      );

      final data = response.data as Map<String, dynamic>;

      if (data['verificationRequired'] == true) {
        return data; // Return to UI for navigation
      }

      // Legacy fallback (if direct creation is ever re-enabled)
      await _handleAuthResponse(data);
      return data;
    } catch (e) {
      debugPrint('❌ Registration failed: $e');
      rethrow;
    }
  }

  /// Verify 6-digit OTP and finalize registration
  Future<KovariUser> verifyOtp(String email, String code) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.verifyOtp,
        data: {'email': email, 'code': code},
      );

      return await _handleAuthResponse(response.data);
    } catch (e) {
      debugPrint('❌ OTP Verification failed: $e');
      rethrow;
    }
  }

  /// Resend a fresh verification code
  Future<void> resendOtp(String email) async {
    try {
      await _apiClient.post(ApiEndpoints.resendOtp, data: {'email': email});
    } catch (e) {
      debugPrint('❌ OTP Resend failed: $e');
      rethrow;
    }
  }

  /// Unified response handler for tokens and user data
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
        await _apiClient
            .post(ApiEndpoints.logout, data: {'refreshToken': refreshToken})
            .timeout(const Duration(seconds: 3));
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
