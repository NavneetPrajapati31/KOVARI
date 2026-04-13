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
    final response = await _apiClient.post<void>(
      ApiEndpoints.changePassword,
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
      parser: (_) {},
    );

    if (!response.success) {
      final message = response.error?.message ?? 'Failed to update password';
      throw Exception(message);
    }
  }

  Future<void> deleteAccount() async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.deleteAccount,
      parser: (_) {},
    );

    if (!response.success) {
      final message = response.error?.message ?? 'Failed to delete account';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>> updateEmail(String newEmail) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      'profile/update',
      data: {'field': 'email', 'value': newEmail},
      parser: (data) => Map<String, dynamic>.from(data),
    );

    if (response.success && response.data != null) {
      return response.data!;
    }

    final message = response.error?.message ?? 'Failed to update email';
    throw Exception(message);
  }

  Future<void> verifyEmail(String email, String code) async {
    final response = await _apiClient.post<void>(
      'profile/verify-email',
      data: {'email': email, 'code': code},
      parser: (_) {},
    );

    if (!response.success) {
      final message = response.error?.message ?? 'Invalid verification code';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>> fetchPolicies() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.acceptPolicies,
        parser: (data) => Map<String, dynamic>.from(data),
      );
      return response.data ?? {};
    } catch (e) {
      // Return empty if fails, read-only display anyway
      return {};
    }
  }
}
