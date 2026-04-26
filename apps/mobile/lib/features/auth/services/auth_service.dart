import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/local_storage.dart';
import '../../../shared/models/kovari_user.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/app_logger.dart';

class AuthService {
  final ApiClient _apiClient;
  final LocalStorage _storage;
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  AuthService(this._apiClient, this._storage);

  /// Handle Google Sign-In SSO
  Future<KovariUser?> loginWithGoogle() async {
    // In 7.x+, authenticate() returns the account.
    final account = await _googleSignIn.authenticate();

    final GoogleSignInAuthentication auth = account.authentication;
    final String? idToken = auth.idToken;

    if (idToken == null) {
      throw Exception("Failed to retrieve Google ID Token");
    }

    AppLogger.i('🚀 Sending Google ID Token to backend...');
    final response = await _apiClient.post<KovariUser>(
      ApiEndpoints.googleAuth,
      data: {'idToken': idToken},
      parser: (data) => _parseAuthResponse(data),
    );

    if (response.success && response.data != null) {
      AppLogger.i('✅ Google Login successful!');
      await _finalizeAuthentication(response.data!, response.raw);
      return response.data;
    }

    AppLogger.e(
      '❌ Google Login failed. Reason: ${response.meta.reason}, Error Message: ${response.error?.message}',
    );
    if (response.raw != null) {
      AppLogger.e('📦 Raw Server Response: ${response.raw}');
    }
    throw Exception(response.error?.message ?? "Google Login failed");
  }

  /// Handle custom Email/Password Login
  Future<KovariUser?> loginWithEmail(String email, String password) async {
    final response = await _apiClient.post<KovariUser>(
      ApiEndpoints.emailLogin,
      data: {'email': email, 'password': password},
      parser: (data) => _parseAuthResponse(data),
    );

    if (response.success && response.data != null) {
      await _finalizeAuthentication(response.data!, response.raw);
      return response.data;
    }
    throw Exception(response.error?.message ?? "Email Login failed");
  }

  /// Handle custom Email/Password Registration (Initial Step)
  Future<Map<String, dynamic>> registerWithEmail(
    String email,
    String password, {
    String? name,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiEndpoints.emailRegister,
      data: {'email': email, 'password': password, 'name': name},
      parser: (data) => data as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      final data = response.data!;
      if (data['verificationRequired'] == true) {
        return data; // Return to UI for navigation
      }
      // If direct creation enabled
      final user = _parseAuthResponse(data);
      await _finalizeAuthentication(user, data);
      return data;
    }
    throw Exception(response.error?.message ?? "Registration failed");
  }

  /// Request Password Reset via Email
  Future<void> requestPasswordReset(String email) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.forgotPassword,
      data: {'email': email, 'platform': 'mobile'},
      parser: (_) {},
    );
    if (!response.success) {
      throw Exception(
        response.error?.message ?? "Forgot Password request failed",
      );
    }
  }

  /// Verify 6-digit OTP and finalize registration
  Future<KovariUser> verifyOtp(String email, String code) async {
    final response = await _apiClient.post<KovariUser>(
      ApiEndpoints.verifyOtp,
      data: {'email': email, 'code': code},
      parser: (data) => _parseAuthResponse(data),
    );

    if (response.success && response.data != null) {
      await _finalizeAuthentication(response.data!, response.raw);
      return response.data!;
    }
    throw Exception(response.error?.message ?? "OTP Verification failed");
  }

  /// Reset Password with token
  Future<void> resetPassword(String token, String newPassword) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.resetPassword,
      data: {'token': token, 'newPassword': newPassword},
      parser: (_) {},
    );
    if (!response.success) {
      throw Exception(response.error?.message ?? "Reset Password failed");
    }
  }

  /// Resend a fresh verification code
  Future<void> resendOtp(String email) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.resendOtp,
      data: {'email': email},
      parser: (_) {},
    );
    if (!response.success) {
      throw Exception(response.error?.message ?? "OTP Resend failed");
    }
  }

  /// Unified response handler for tokens and user data
  Future<void> _finalizeAuthentication(KovariUser user, dynamic rawData) async {
    final Map<String, dynamic> responseData = rawData as Map<String, dynamic>;

    final accessToken = responseData['accessToken'] as String;
    final refreshToken = responseData['refreshToken'] as String;

    // 1. Store tokens securely
    await _storage.saveAccessToken(accessToken);
    await _storage.saveRefreshToken(refreshToken);

    // 2. Map user and save
    await _storage.saveUserData(user.toJson());

    // 3. Update ApiClient
    _apiClient.setToken(accessToken);
  }

  /// Pure parser for Auth responses
  KovariUser _parseAuthResponse(dynamic data) {
    final Map<String, dynamic> responseData = data as Map<String, dynamic>;
    final userMap = responseData['user'] as Map<String, dynamic>;
    return KovariUser.fromAuthResponse(userMap);
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
            .post<void>(
              ApiEndpoints.logout,
              data: {'refreshToken': refreshToken},
              parser: (_) {},
            )
            .timeout(const Duration(seconds: 3));
      }

      // 2. Clear Google Session
      await _googleSignIn.signOut();
    } catch (e) {
      AppLogger.e('ℹ️ Logout cleanup (server or Google): $e');
    }

    // 3. Wipe local state
    _apiClient.clearToken();
    await _storage.clear();
  }
}
