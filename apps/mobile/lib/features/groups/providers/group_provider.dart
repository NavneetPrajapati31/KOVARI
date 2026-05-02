import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/cache_provider.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/group.dart';
import '../models/group_state.dart';
import '../data/group_service.dart';

final groupServiceProvider = Provider<GroupService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return GroupService(apiClient);
});

final myGroupsProvider = StateNotifierProvider<MyGroupsNotifier, GroupState>((
  ref,
) {
  return MyGroupsNotifier(ref);
});

class MyGroupsNotifier extends StateNotifier<GroupState> {
  final Ref _ref;
  MyGroupsNotifier(this._ref) : super(GroupState()) {
    _init();
  }

  Future<void> _init() async {
    _ref.watch(authStateProvider);
    await refresh(isInitial: true);
  }

  Future<void> refresh({bool isInitial = false}) async {
    final cache = _ref.read(localCacheProvider);
    final service = _ref.read(groupServiceProvider);

    // 1. Try Cache First
    final cached = cache.get(ApiEndpoints.myGroups);
    if (cached != null) {
      state = state.copyWith(
        groups: service.parseGroups(cached.data),
        isStale: true,
        isLoading: isInitial,
      );
    } else {
      state = state.copyWith(isLoading: true);
    }

    // 2. Fetch Fresh Data
    try {
      final freshGroups = await service.getMyGroups();
      state = state.copyWith(
        groups: freshGroups,
        isStale: false,
        isLoading: false,
        error: null,
      );
    } catch (e) {
      if (state.groups.isEmpty) {
        state = state.copyWith(error: e.toString(), isLoading: false);
      } else {
        state = state.copyWith(isStale: false, isLoading: false);
      }
    }
  }
}
