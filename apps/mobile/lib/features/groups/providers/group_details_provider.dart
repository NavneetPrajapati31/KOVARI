import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/group_service.dart';
import '../models/group.dart';
import 'group_provider.dart';

final groupDetailsProvider = FutureProvider.family<GroupModel, String>((
  ref,
  groupId,
) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupDetails(groupId);
});

final groupMembersProvider = FutureProvider.family<List<GroupMember>, String>((
  ref,
  groupId,
) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupMembers(groupId);
});

final joinRequestsProvider = FutureProvider.family<List<JoinRequestModel>, String>((
  ref,
  groupId,
) async {
  final service = ref.watch(groupServiceProvider);
  return service.getJoinRequests(groupId);
});

// The base source of truth itinerary
final groupItineraryProvider =
    FutureProvider.family<List<ItineraryItem>, String>((ref, groupId) async {
      final service = ref.watch(groupServiceProvider);
      return service.getGroupItinerary(groupId);
    });

// A simple Notifier managing a Map of optimistic overrides for different groups.
class OptimisticStoreNotifier
    extends Notifier<Map<String, List<ItineraryItem>>> {
  @override
  Map<String, List<ItineraryItem>> build() => {};

  void set(String groupId, List<ItineraryItem>? value) {
    final newState = Map<String, List<ItineraryItem>>.from(state);
    if (value == null) {
      newState.remove(groupId);
    } else {
      newState[groupId] = value;
    }
    state = newState;
  }
}

final optimisticStoreProvider =
    NotifierProvider<OptimisticStoreNotifier, Map<String, List<ItineraryItem>>>(
      OptimisticStoreNotifier.new,
    );

final groupMembershipProvider = FutureProvider.family<MembershipInfo, String>((
  ref,
  groupId,
) async {
  final service = ref.watch(groupServiceProvider);
  return service.getGroupMembership(groupId);
});

class GroupActionsNotifier {
  final GroupService _service;
  final Ref _ref;
  final String _groupId;

  GroupActionsNotifier(this._service, this._ref, this._groupId);

  Future<void> updateNotes(String notes) async {
    await _service.updateGroupNotes(_groupId, notes);
    _ref.invalidate(groupDetailsProvider(_groupId));
  }

  Future<void> updateGroup(Map<String, dynamic> data) async {
    await _service.updateGroup(_groupId, data);
    _ref.invalidate(groupDetailsProvider(_groupId));
    _ref.invalidate(myGroupsProvider);
  }

  Future<void> approveRequest(String userId) async {
    await _service.approveJoinRequest(_groupId, userId);
    _ref.invalidate(joinRequestsProvider(_groupId));
    _ref.invalidate(groupMembersProvider(_groupId));
    _ref.invalidate(groupDetailsProvider(_groupId));
  }

  Future<void> rejectRequest(String requestId) async {
    await _service.rejectJoinRequest(_groupId, requestId);
    _ref.invalidate(joinRequestsProvider(_groupId));
  }

  Future<void> removeMember(String memberId, String memberClerkId) async {
    await _service.removeMember(_groupId, memberId, memberClerkId);
    _ref.invalidate(groupMembersProvider(_groupId));
    _ref.invalidate(groupDetailsProvider(_groupId));
  }

  Future<void> inviteMember(String usernameOrEmail) async {
    final Map<String, String> invite = usernameOrEmail.contains('@')
        ? {'email': usernameOrEmail}
        : {'username': usernameOrEmail};
    await _service.sendGroupInvite(_groupId, [invite]);
  }

  Future<String> getInviteLink() async {
    return _service.getInviteLink(_groupId);
  }

  Future<void> generateAiOverview() async {
    await _service.generateAiOverview(_groupId);
    _ref.invalidate(groupDetailsProvider(_groupId));
  }

  Future<void> joinRequest() async {
    await _service.sendJoinRequest(_groupId);
    _ref.invalidate(groupMembershipProvider(_groupId));
  }

  Future<void> joinViaInvite() async {
    await _service.joinGroup(_groupId, viaInvite: true);
    _ref.invalidate(groupMembershipProvider(_groupId));
    _ref.invalidate(myGroupsProvider);
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

  Future<void> updateItineraryStatus(ItineraryItem item, String status) async {
    // 1. Prepare optimistic state from current data using modern .value
    final itineraryAsync = _ref.read(groupItineraryProvider(_groupId));
    final currentList = itineraryAsync.value ?? [];

    final newList = currentList.map((i) {
      if (i.id == item.id) {
        final data = i.toJson();
        data['status'] = status;
        return ItineraryItem.fromJson(data);
      }
      return i;
    }).toList();

    // 2. Apply optimistic update via the store notifier
    _ref.read(optimisticStoreProvider.notifier).set(_groupId, newList);

    try {
      // 3. Perform network call
      final data = item.toJson();
      data['status'] = status;
      data['group_id'] = _groupId;
      await _service.updateItineraryItem(_groupId, item.id, data);

      // 4. Invalidate base provider to trigger backend-sync
      _ref.invalidate(groupItineraryProvider(_groupId));

      // 5. WAIT for the server data to actually update before clearing the optimistic state
      // This prevents the "blink" where the UI reverts to old server data while waiting.
      await _ref.read(groupItineraryProvider(_groupId).future);
    } catch (e) {
      // Re-throw to show error feedback in UI if needed
      rethrow;
    } finally {
      // Small safety delay to ensure UI rebuilds with the new server data
      await Future.delayed(const Duration(milliseconds: 100));
      _ref.read(optimisticStoreProvider.notifier).set(_groupId, null);
    }
  }

  Future<void> createItineraryItem(Map<String, dynamic> data) async {
    await _service.createItineraryItem(_groupId, data);
    _ref.invalidate(groupItineraryProvider(_groupId));
  }

  Future<void> deleteItineraryItem(String itemId) async {
    await _service.deleteItineraryItem(_groupId, itemId);
    _ref.invalidate(groupItineraryProvider(_groupId));
  }

  Future<void> updateItineraryItem(String itemId, Map<String, dynamic> data) async {
    await _service.updateItineraryItem(_groupId, itemId, data);
    _ref.invalidate(groupItineraryProvider(_groupId));
  }
}

final groupActionsProvider = Provider.family<GroupActionsNotifier, String>((ref, groupId) {
  final service = ref.watch(groupServiceProvider);
  return GroupActionsNotifier(service, ref, groupId);
});
