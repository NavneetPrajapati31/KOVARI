import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/group_service.dart';
import '../models/group.dart';
import 'group_provider.dart';

final groupDetailsProvider = FutureProvider.family<Group, String>((ref, groupId) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupDetails(groupId);
});

final groupMembersProvider = FutureProvider.family<List<GroupMember>, String>((ref, groupId) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupMembers(groupId);
});

final groupItineraryProvider = FutureProvider.family<List<ItineraryItem>, String>((ref, groupId) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupItinerary(groupId);
});

final groupMembershipProvider = FutureProvider.family<MembershipInfo, String>((ref, groupId) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupMembership(groupId);
});

class GroupActionsNotifier {
  final GroupService _service;
  final WidgetRef _ref;
  final String _groupId;

  GroupActionsNotifier(this._service, this._ref, this._groupId);

  Future<void> updateNotes(String notes) async {
    await _service.updateGroupNotes(_groupId, notes);
    _ref.invalidate(groupDetailsProvider(_groupId));
  }

  Future<void> generateAiOverview() async {
    await _service.generateAiOverview(_groupId);
    _ref.invalidate(groupDetailsProvider(_groupId));
  }

  Future<void> joinRequest() async {
    await _service.sendJoinRequest(_groupId);
    _ref.invalidate(groupMembershipProvider(_groupId));
  }

  Future<void> leaveGroup() async {
    await _service.leaveGroup(_groupId);
    _ref.invalidate(groupMembershipProvider(_groupId));
    _ref.invalidate(myGroupsProvider);
  }

  Future<void> deleteGroup() async {
    await _service.deleteGroup(_groupId);
    _ref.invalidate(myGroupsProvider);
  }
}
