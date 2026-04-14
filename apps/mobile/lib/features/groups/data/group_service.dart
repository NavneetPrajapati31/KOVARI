import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/group.dart';

class GroupService {
  final ApiClient _apiClient;

  GroupService(this._apiClient);

  Future<List<GroupModel>> getMyGroups() async {
    final response = await _apiClient.get<List<GroupModel>>(
      ApiEndpoints.myGroups,
      parser: (data) {
        final List<dynamic> rawList =
            data is Map<String, dynamic> ? (data['data'] ?? []) : [];
        return safeParseList(rawList, GroupModel.fromJson);
      },
    );
    return response.data ?? [];
  }

  Future<GroupModel> createGroup(Map<String, dynamic> data) async {
    final response = await _apiClient.post<GroupModel>(
      ApiEndpoints.createGroup,
      data: data,
      parser: (json) => GroupModel.fromJson(json as Map<String, dynamic>),
    );
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception(response.error?.message ?? 'Failed to create group');
  }

  Future<GroupModel> getGroupDetails(String groupId) async {
    final response = await _apiClient.get<GroupModel>(
      ApiEndpoints.groupDetails(groupId),
      parser: (json) => GroupModel.fromJson(json as Map<String, dynamic>),
    );
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception(response.error?.message ?? 'Failed to fetch group details');
  }

  Future<List<GroupMember>> getGroupMembers(String groupId) async {
    final response = await _apiClient.get<List<GroupMember>>(
      ApiEndpoints.groupMembers(groupId),
      parser: (data) {
        final List<dynamic> members =
            data is Map<String, dynamic> ? (data['members'] ?? []) : [];
        return safeParseList(members, GroupMember.fromJson);
      },
    );
    return response.data ?? [];
  }

  Future<List<ItineraryItem>> getGroupItinerary(String groupId) async {
    final response = await _apiClient.get<List<ItineraryItem>>(
      ApiEndpoints.groupItinerary(groupId),
      parser: (data) {
        final List<dynamic> rawList = data is List ? data : [];
        return safeParseList(rawList, ItineraryItem.fromJson);
      },
    );
    return response.data ?? [];
  }

  Future<MembershipInfo> getGroupMembership(String groupId) async {
    final response = await _apiClient.get<MembershipInfo>(
      ApiEndpoints.groupMembership(groupId),
      parser: (json) => MembershipInfo.fromJson(json as Map<String, dynamic>),
    );
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception('Failed to fetch group membership');
  }

  Future<void> sendJoinRequest(String groupId) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.groupJoinRequest(groupId),
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to send join request');
  }

  Future<void> generateAiOverview(String groupId) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.groupAiOverview(groupId),
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to generate AI overview');
  }

  Future<GroupModel> updateGroupNotes(String groupId, String notes) async {
    final response = await _apiClient.patch<GroupModel>(
      ApiEndpoints.groupDetails(groupId),
      data: {'notes': notes},
      parser: (json) => GroupModel.fromJson(json as Map<String, dynamic>),
    );
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception('Failed to update group notes');
  }

  Future<void> updateItineraryItem(
    String groupId,
    String itemId,
    Map<String, dynamic> data,
  ) async {
    final response = await _apiClient.put<void>(
      ApiEndpoints.itineraryItem(groupId, itemId),
      data: data,
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to update itinerary item');
  }

  Future<void> createItineraryItem(
    String groupId,
    Map<String, dynamic> data,
  ) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.groupItinerary(groupId),
      data: data,
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to create itinerary item');
  }

  Future<void> deleteItineraryItem(
    String groupId,
    String itemId,
  ) async {
    final response = await _apiClient.delete<void>(
      ApiEndpoints.itineraryItem(groupId, itemId),
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to delete itinerary item');
  }

  Future<void> leaveGroup(String groupId) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.groupLeave(groupId),
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to leave group');
  }

  Future<void> deleteGroup(String groupId) async {
    final response = await _apiClient.delete<void>(
      ApiEndpoints.groupDelete(groupId),
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to delete group');
  }
}
