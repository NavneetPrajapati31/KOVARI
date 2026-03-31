import '../../../core/network/api_client.dart';

class ProfileService {
  final ApiClient _apiClient;

  ProfileService(this._apiClient);

  /// POST /api/profile
  /// Replicates the backend profile update logic.
  Future<bool> updateProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _apiClient.post('profile', data: profileData);
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  /// POST /api/travel-preferences
  /// Replicates the travel preferences submission.
  Future<bool> updateTravelPreferences(
    Map<String, dynamic> preferencesData,
  ) async {
    try {
      final response = await _apiClient.post(
        'travel-preferences',
        data: preferencesData,
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  /// POST /api/settings/accept-policies
  /// Records the acceptance of terms, privacy, and guidelines versions.
  Future<bool> acceptPolicies({
    required String termsVersion,
    required String privacyVersion,
    required String guidelinesVersion,
  }) async {
    try {
      final response = await _apiClient.post(
        'settings/accept-policies',
        data: {
          'termsVersion': termsVersion,
          'privacyVersion': privacyVersion,
          'guidelinesVersion': guidelinesVersion,
        },
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  /// POST /api/check-username
  /// Checks if the requested username is unique in the system.
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
