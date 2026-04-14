import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/api_error_handler.dart';

class ProfileService {
  final ApiClient _apiClient;

  ProfileService(this._apiClient);

  /// GET /api/profile/current
  /// Fetches the profile of the currently authenticated user.
  Future<Map<String, dynamic>?> getCurrentProfile() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.currentProfile,
        parser: (data) => data is Map<String, dynamic> ? data : {},
      );

      if (response.success && response.data != null) {
        return response.data;
      }
      return null;
    } catch (e) {
      // 404 is a valid case (profile doesn't exist yet), others are handled by ApiClient fallback
      return null;
    }
  }

  /// POST /api/profile
  /// Creates or updates the user's profile.
  Future<void> updateProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _apiClient.post<void>(
        ApiEndpoints.createProfile,
        data: profileData,
        parser: (_) {},
      );
      if (!response.success) {
        throw Exception('Failed to update profile');
      }
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// POST /api/settings/accept-policies
  /// Records that the user has accepted specific versions of policies.
  Future<void> acceptPolicies({
    required String termsVersion,
    required String privacyVersion,
    required String guidelinesVersion,
  }) async {
    try {
      final response = await _apiClient.post<void>(
        'settings/accept-policies',
        data: {
          'termsVersion': termsVersion,
          'privacyVersion': privacyVersion,
          'guidelinesVersion': guidelinesVersion,
        },
        parser: (_) {},
      );
      if (!response.success) {
        throw Exception('Failed to accept policies');
      }
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// POST /api/check-username
  /// Checks if a username is available.
  Future<bool> checkUsernameAvailable(String username) async {
    if (username.trim().length < 3) return false;
    try {
      final response = await _apiClient.post<bool>(
        'check-username',
        data: {'username': username},
        parser: (data) {
          if (data is Map<String, dynamic>) {
            return data['available'] == true;
          }
          return false;
        },
      );
      return response.data ?? false;
    } catch (e) {
      return false;
    }
  }
}
