import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/local_storage.dart';
import '../../../shared/models/kovari_user.dart';
import '../../../core/network/api_endpoints.dart';

class AuthService {
  final ApiClient _apiClient;
  final LocalStorage _storage;
  final ClerkAuthState _authState;

  AuthService(this._apiClient, this._storage, this._authState);

  /// Handle User Synchronization with Backend
  /// POST /api/users/sync
  Future<String> syncUser(String clerkUserId) async {
    final res = await _apiClient.post(
      ApiEndpoints.syncUser,
      data: {"clerkUserId": clerkUserId},
    );

    return res.data["userId"];
  }

  Future<KovariUser?> legacySyncUser() async {
    try {
      final user = _authState.user;
      if (user == null) return null;

      // Force real API for the critical sync endpoint
      final realClient = ApiClientFactory.create(forceReal: true);

      // Inject token before call
      final sessionToken = await _authState.sessionToken();
      final token = sessionToken.jwt;
      realClient.setToken(token);

      final response = await realClient.post(
        'users/sync',
        data: {'clerkUserId': user.id},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        final supabaseUuid = data['userId'] as String;

        final kovariUser = KovariUser(
          clerkId: user.id,
          supabaseUuid: supabaseUuid,
        );

        // Persist full user data locally
        await _storage.saveUserData(kovariUser.toJson());

        return kovariUser;
      }
    } catch (e) {
      debugPrint('❌ User sync failed: $e');
      rethrow;
    }
    return null;
  }

  /// Get current session token from Clerk and inject into ApiClient
  Future<String?> refreshSessionToken() async {
    if (!_authState.isSignedIn) return null;

    try {
      final sessionToken = await _authState.sessionToken();
      final token = sessionToken.jwt;

      _apiClient.setToken(token);
      await _storage.saveToken(token);

      return token;
    } catch (e) {
      debugPrint('❌ Failed to refresh session token: $e');
      return null;
    }
  }

  /// Logout and clear all storage
  Future<void> logout() async {
    await _authState.signOut();
    _apiClient.clearToken();
    await _storage.clear();
  }
}
