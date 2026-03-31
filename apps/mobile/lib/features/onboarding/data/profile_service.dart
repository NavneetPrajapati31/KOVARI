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
      final response = await _apiClient.get(ApiEndpoints.currentProfile);
      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      // 404 is a valid case (profile doesn't exist yet), others are errors
      return null;
    }
  }

  /// POST /api/profile
  /// Creates or updates the user's profile.
  Future<void> updateProfile(Map<String, dynamic> profileData) async {
    try {
      await _apiClient.post(ApiEndpoints.createProfile, data: profileData);
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
      await _apiClient.post(
        'settings/accept-policies',
        data: {
          'termsVersion': termsVersion,
          'privacyVersion': privacyVersion,
          'guidelinesVersion': guidelinesVersion,
        },
      );
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// POST /api/check-username
  /// Checks if a username is available.
  Future<bool> checkUsernameAvailable(String username) async {
    if (username.trim().length < 3) return false;
    try {
      final response = await _apiClient.post(
        'check-username',
        data: {'username': username},
      );
      final data = response.data as Map<String, dynamic>;
      return data['available'] == true;
    } catch (e) {
      return false;
    }
  }
}
