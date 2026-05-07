import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/request_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final requestServiceProvider = Provider<RequestService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return RequestService(apiClient);
});

class RequestService {
  final ApiClient _apiClient;

  RequestService(this._apiClient);

  Future<List<InterestModel>> getInterests() async {
    try {
      final response = await _apiClient.get<List<InterestModel>>(
        ApiEndpoints.interests,
        parser: (data) => safeParseList(
          data is List ? data : [],
          InterestModel.fromJson,
        ),
      );
      return response.data ?? [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<InvitationModel>> getPendingInvitations() async {
    try {
      final response = await _apiClient.get<List<InvitationModel>>(
        ApiEndpoints.pendingInvitations,
        parser: (data) => safeParseList(
          data is List ? data : [],
          InvitationModel.fromJson,
        ),
      );
      return response.data ?? [];
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> respondToInterest(String interestId, String action) async {
    try {
      final response = await _apiClient.post<void>(
        ApiEndpoints.interestsRespond,
        data: {'interestId': interestId, 'action': action},
        parser: (_) {},
      );
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> respondToInvitation(String groupId, String action) async {
    try {
      final response = await _apiClient.post<void>(
        ApiEndpoints.groupInvitation,
        data: {'groupId': groupId, 'action': action},
        parser: (_) {},
      );
      return response.success;
    } catch (e) {
      return false;
    }
  }
}
