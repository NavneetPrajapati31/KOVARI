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
        final List<dynamic> rawList = data is List ? data : [];
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
      parser: (json) {
        if (json is List) {
          return json.map((m) => GroupMember.fromJson(m)).toList();
        }
        if (json is Map && json['members'] is List) {
          return (json['members'] as List)
              .map((m) => GroupMember.fromJson(m))
              .toList();
        }
        return [];
      },
    );
    return response.data ?? [];
  }

  Future<List<JoinRequestModel>> getJoinRequests(String groupId) async {
    final response = await _apiClient.get<List<JoinRequestModel>>(
      ApiEndpoints.groupJoinRequest(groupId),
      parser: (json) {
        if (json is Map && json['joinRequests'] is List) {
          return (json['joinRequests'] as List)
              .map((r) => JoinRequestModel.fromJson(r))
              .toList();
        }
        return [];
      },
    );
    return response.data ?? [];
  }

  Future<void> approveJoinRequest(String groupId, String userId) async {
    final response = await _apiClient.post<dynamic>(
      ApiEndpoints.groupJoin(groupId),
      data: {'userId': userId},
      parser: (json) => json,
    );
    if (!response.success)
      throw Exception(response.error?.message ?? 'Failed to approve');
  }

  Future<void> rejectJoinRequest(String groupId, String requestId) async {
    final response = await _apiClient.delete<dynamic>(
      ApiEndpoints.groupJoinRequest(groupId),
      data: {'requestId': requestId},
      parser: (json) => json,
    );
    if (!response.success)
      throw Exception(response.error?.message ?? 'Failed to reject');
  }

  Future<void> removeMember(
    String groupId,
    String memberId,
    String memberClerkId,
  ) async {
    final response = await _apiClient.delete<dynamic>(
      ApiEndpoints.groupMembers(groupId),
      data: {'memberId': memberId, 'memberClerkId': memberClerkId},
      parser: (json) => json,
    );
    if (!response.success)
      throw Exception(response.error?.message ?? 'Failed to remove member');
  }

  Future<String> getInviteLink(String groupId) async {
    final response = await _apiClient.get<String>(
      "${ApiEndpoints.groupInvitationLink(groupId)}&platform=mobile",
      parser: (json) => (json as Map)['link'] as String,
    );
    return response.data ?? '';
  }

  Future<Map<String, dynamic>> getInviteInfo(String token) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiEndpoints.v1InviteInfo(token),
      parser: (json) => json as Map<String, dynamic>,
    );
    if (!response.success || response.data == null) {
      throw Exception(response.error?.message ?? 'Invalid invite link');
    }
    return response.data!;
  }

  Future<void> sendGroupInvite(
    String groupId,
    List<Map<String, String>> invites,
  ) async {
    final response = await _apiClient.post<dynamic>(
      ApiEndpoints.groupInvitationSend,
      data: {'groupId': groupId, 'invites': invites, 'platform': 'mobile'},
      parser: (json) => json,
    );
    if (!response.success)
      throw Exception(response.error?.message ?? 'Failed to send invites');
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

  Future<void> joinGroup(String groupId, {bool viaInvite = false}) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.groupJoin(groupId),
      data: viaInvite ? {'viaInvite': true} : {},
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to join group');
  }

  Future<void> generateAiOverview(String groupId) async {
    final response = await _apiClient.post<void>(
      ApiEndpoints.groupAiOverview(groupId),
      parser: (_) {},
    );
    if (!response.success) throw Exception('Failed to generate AI overview');
  }

  Future<GroupModel> updateGroup(
    String groupId,
    Map<String, dynamic> data,
  ) async {
    final response = await _apiClient.patch<GroupModel>(
      ApiEndpoints.groupDetails(groupId),
      data: data,
      parser: (json) => GroupModel.fromJson(json as Map<String, dynamic>),
    );
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception(response.error?.message ?? 'Failed to update group');
  }

  Future<GroupModel> updateGroupNotes(String groupId, String notes) async {
    return updateGroup(groupId, {'notes': notes});
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

  Future<void> deleteItineraryItem(String groupId, String itemId) async {
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
