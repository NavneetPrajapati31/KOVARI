import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/request_model.dart';
import '../services/request_service.dart';

final interestsProvider =
    AsyncNotifierProvider<InterestsNotifier, List<InterestModel>>(
      InterestsNotifier.new,
    );

class InterestsNotifier extends AsyncNotifier<List<InterestModel>> {
  @override
  FutureOr<List<InterestModel>> build() async {
    return _fetchInterests();
  }

  Future<List<InterestModel>> _fetchInterests() async {
    final service = ref.read(requestServiceProvider);
    return service.getInterests();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchInterests());
  }

  Future<void> respond(String interestId, String action) async {
    final service = ref.read(requestServiceProvider);
    final previousState = state.value ?? [];

    // Optimistic update
    state = AsyncData(previousState.where((i) => i.id != interestId).toList());

    final success = await service.respondToInterest(interestId, action);
    if (!success) {
      // Revert if failed
      state = AsyncData(previousState);
    }
  }
}

final invitationsProvider =
    AsyncNotifierProvider<InvitationsNotifier, List<InvitationModel>>(
      InvitationsNotifier.new,
    );

class InvitationsNotifier extends AsyncNotifier<List<InvitationModel>> {
  @override
  FutureOr<List<InvitationModel>> build() async {
    return _fetchInvitations();
  }

  Future<List<InvitationModel>> _fetchInvitations() async {
    final service = ref.read(requestServiceProvider);
    return service.getPendingInvitations();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchInvitations());
  }

  Future<void> respond(String groupId, String action) async {
    final service = ref.read(requestServiceProvider);
    final previousState = state.value ?? [];

    // Optimistic update
    state = AsyncData(previousState.where((i) => i.id != groupId).toList());

    final success = await service.respondToInvitation(groupId, action);
    if (!success) {
      // Revert if failed
      state = AsyncData(previousState);
    }
  }
}
