import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_endpoints.dart';
import 'package:mobile/core/utils/safe_parser.dart';
import 'package:mobile/features/requests/models/request_model.dart';

final requestServiceProvider = Provider<RequestService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return RequestService(apiClient);
});

class RequestService {

  RequestService(this._apiClient);
  final ApiClient _apiClient;

  Future<List<InterestModel>> getInterests() async {
    try {
      final response = await _apiClient.get<List<InterestModel>>(
        ApiEndpoints.interests,
        parser: (data) => safeParseList(
          data is List ? data : <dynamic>[],
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
          data is List ? data : <dynamic>[],
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
