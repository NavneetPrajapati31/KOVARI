import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/auth/token_storage.dart';
import '../../../core/auth/session_manager.dart';
import '../../../shared/models/kovari_user.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/app_logger.dart';
import 'dart:convert';

class AuthService {
  final ApiClient _apiClient;
  final TokenStorage _storage = TokenStorage();
  final SessionManager _sessionManager;
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  AuthService(this._apiClient, this._sessionManager);

  Future<KovariUser?> loginWithGoogle({CancelToken? cancelToken}) async {
    AppLogger.d('Starting Google Authentication flow...');
    final account = await _googleSignIn.authenticate();

    if (account == null) {
      AppLogger.w('Google Authentication was cancelled by the user.');
      return null;
    }

    AppLogger.d(
      'Google Account retrieved: ${account.email}. Fetching tokens...',
    );
    final auth = account.authentication;
    final String? idToken = auth.idToken;

    if (idToken == null) {
      AppLogger.e(
        'Failed to retrieve Google ID Token from authentication result.',
      );
      throw Exception("Failed to retrieve Google ID Token");
    }

    AppLogger.i(
      'Google ID Token retrieved successfully (length: ${idToken.length}). Authenticating with backend...',
    );

    final response = await _apiClient.post<KovariUser>(
      ApiEndpoints.googleAuth,
      data: {'idToken': idToken},
      parser: (data) => parseAuthResponse(data),
      cancelToken: cancelToken,
    );

    if (response.success && response.data != null) {
      await _finalizeAuthentication(response.data!, response.raw);
      return response.data;
    }
    throw Exception(response.error?.message ?? "Google Login failed");
  }

  Future<KovariUser?> loginWithEmail(
    String email,
    String password, {
    CancelToken? cancelToken,
  }) async {
    final response = await _apiClient.post<KovariUser>(
      ApiEndpoints.emailLogin,
      data: {'email': email, 'password': password},
      parser: (data) => parseAuthResponse(data),
      cancelToken: cancelToken,
    );

    if (response.success && response.data != null) {
      await _finalizeAuthentication(response.data!, response.raw);
      return response.data;
    }
    throw Exception(response.error?.message ?? "Email Login failed");
  }

  Future<Map<String, dynamic>> registerWithEmail(
    String email,
    String password, {
    String? name,
    CancelToken? cancelToken,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiEndpoints.emailRegister,
      data: {'email': email, 'password': password, 'name': name},
      parser: (data) => data as Map<String, dynamic>,
      cancelToken: cancelToken,
    );

    if (response.success && response.data != null) {
      final data = response.data!;
      if (data['verificationRequired'] == true) return data;

      final user = parseAuthResponse(data);
      await _finalizeAuthentication(user, data);
      return data;
    }
    throw Exception(response.error?.message ?? "Registration failed");
  }

  Future<void> resendOtp(String email, {CancelToken? cancelToken}) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.resendOtp,
      data: {'email': email},
      parser: (_) {},
      cancelToken: cancelToken,
    );
    if (!response.success) {
      throw Exception(response.error?.message ?? "OTP Resend failed");
    }
  }

  Future<void> requestPasswordReset(
    String email, {
    CancelToken? cancelToken,
  }) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.forgotPassword,
      data: {'email': email, 'platform': 'mobile'},
      parser: (_) {},
      cancelToken: cancelToken,
    );
    if (!response.success) {
      throw Exception(
        response.error?.message ?? "Forgot Password request failed",
      );
    }
  }

  Future<void> resetPassword(
    String token,
    String newPassword, {
    CancelToken? cancelToken,
  }) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.resetPassword,
      data: {'token': token, 'newPassword': newPassword},
      parser: (_) {},
      cancelToken: cancelToken,
    );
    if (!response.success) {
      throw Exception(response.error?.message ?? "Reset Password failed");
    }
  }

  Future<KovariUser> verifyOtp(
    String email,
    String code, {
    CancelToken? cancelToken,
  }) async {
    final response = await _apiClient.post<KovariUser>(
      ApiEndpoints.verifyOtp,
      data: {'email': email, 'code': code},
      parser: (data) => parseAuthResponse(data),
      cancelToken: cancelToken,
    );

    if (response.success && response.data != null) {
      await _finalizeAuthentication(response.data!, response.raw);
      return response.data!;
    }
    throw Exception(response.error?.message ?? "OTP Verification failed");
  }

  Future<void> _finalizeAuthentication(KovariUser user, dynamic rawData) async {
    final Map<String, dynamic> responseData = rawData as Map<String, dynamic>;
    final data = responseData['data'] ?? responseData;

    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String;
    final expiry =
        data['expiry'] as int? ??
        (DateTime.now().millisecondsSinceEpoch + 3600000);

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiryTimestamp: expiry,
    );

    await _storage.saveUserData(jsonEncode(user.toJson()));
    _sessionManager.setAuthenticated(true);
    _sessionManager.setDisableRefresh(false);
  }

  KovariUser parseAuthResponse(dynamic data) {
    final Map<String, dynamic> responseData = data as Map<String, dynamic>;
    final innerData = responseData['data'] ?? responseData;
    final userMap = innerData['user'] as Map<String, dynamic>;
    return KovariUser.fromAuthResponse(userMap);
  }
}

final authServiceProvider = Provider((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final session = ref.watch(sessionManagerProvider);
  return AuthService(apiClient, session);
});
