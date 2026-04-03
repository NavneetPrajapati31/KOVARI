import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';

class SettingsService {
  final ApiClient _apiClient;

  SettingsService(this._apiClient);

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      await _apiClient.post(
        ApiEndpoints.changePassword,
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to update password';
      throw Exception(message);
    }
  }

  Future<void> deleteAccount() async {
    try {
      await _apiClient.post(ApiEndpoints.deleteAccount);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to delete account';
      throw Exception(message);
    }
  }

  Future<void> updateEmail(String newEmail) async {
    try {
      await _apiClient.patch(
        'profile/update',
        data: {
          'field': 'email',
          'value': newEmail,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to update email';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>> fetchPolicies() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.acceptPolicies);
      return response.data;
    } catch (e) {
      // Return empty if fails, read-only display anyway
      return {};
    }
  }
}
