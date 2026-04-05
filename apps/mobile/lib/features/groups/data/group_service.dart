import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/group.dart';

class GroupService {
  final ApiClient _apiClient;

  GroupService(this._apiClient);

  Future<List<Group>> getMyGroups() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.myGroups);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        return data
            .map((json) => Group.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error fetching my groups: $e');
      rethrow;
    }
  }

  Future<Group> createGroup(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.createGroup,
        data: data,
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return Group.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception('Failed to create group');
    } catch (e) {
      print('Error creating group: $e');
      rethrow;
    }
  }

  Future<Group> getGroupDetails(String groupId) async {
    final response = await _apiClient.get(ApiEndpoints.groupDetails(groupId));
    return Group.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<GroupMember>> getGroupMembers(String groupId) async {
    final response = await _apiClient.get(ApiEndpoints.groupMembers(groupId));
    final List<dynamic> members = response.data['members'] as List<dynamic>;
    return members.map((j) => GroupMember.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<List<ItineraryItem>> getGroupItinerary(String groupId) async {
    final response = await _apiClient.get(ApiEndpoints.groupItinerary(groupId));
    final List<dynamic> items = response.data as List<dynamic>;
    return items.map((j) => ItineraryItem.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<MembershipInfo> getGroupMembership(String groupId) async {
    final response = await _apiClient.get(ApiEndpoints.groupMembership(groupId));
    return MembershipInfo.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> sendJoinRequest(String groupId) async {
    await _apiClient.post(ApiEndpoints.groupJoinRequest(groupId));
  }

  Future<void> generateAiOverview(String groupId) async {
    await _apiClient.post(ApiEndpoints.groupAiOverview(groupId));
  }

  Future<Group> updateGroupNotes(String groupId, String notes) async {
    final response = await _apiClient.patch(
      ApiEndpoints.groupDetails(groupId),
      data: {'notes': notes},
    );
    return Group.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> leaveGroup(String groupId) async {
    await _apiClient.post(ApiEndpoints.groupLeave(groupId));
  }

  Future<void> deleteGroup(String groupId) async {
    await _apiClient.delete(ApiEndpoints.groupDelete(groupId));
  }
}
