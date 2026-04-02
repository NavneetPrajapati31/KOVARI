import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/request_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final requestServiceProvider = Provider<RequestService>((ref) {
  return RequestService(ApiClientFactory.create());
});

class RequestService {
  final ApiClient _apiClient;

  RequestService(this._apiClient);

  Future<List<InterestModel>> getInterests() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.interests);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => InterestModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<InvitationModel>> getPendingInvitations() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.pendingInvitations);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => InvitationModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> respondToInterest(String interestId, String action) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.interestsRespond,
        data: {'interestId': interestId, 'action': action},
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> respondToInvitation(String groupId, String action) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.groupInvitation,
        data: {'groupId': groupId, 'action': action},
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
