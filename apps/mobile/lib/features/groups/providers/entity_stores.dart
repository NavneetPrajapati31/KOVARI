import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../models/group.dart';
import '../models/hydrated_state.dart';
import '../../../core/runtime/hydration_engine.dart';
import '../../../core/runtime/runtime_coordinator.dart';
import '../../../core/runtime/runtime_scheduler.dart';
import '../../../core/providers/cache_provider.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/runtime/mutation_journal.dart';
import 'group_provider.dart'; // for groupServiceProvider

// ─────────────────────────────────────────────
// Entity Metadata for GC
// ─────────────────────────────────────────────

enum EntityTier { hot, warm, cold }

class EntityMetadata {
  int subscriberCount = 0;
  DateTime lastAccessedAt = DateTime.now();

  EntityTier get tier {
    if (subscriberCount > 0) return EntityTier.hot;
    final age = DateTime.now().difference(lastAccessedAt);
    if (age < const Duration(minutes: 5)) return EntityTier.warm;
    return EntityTier.cold;
  }
}

// ─────────────────────────────────────────────
// Group Entity Store
// ─────────────────────────────────────────────

class GroupStore extends Notifier<Map<String, HydratedState<GroupModel>>> {
  final Map<String, EntityMetadata> _metadata = {};
  Timer? _gcTimer;

  @override
  Map<String, HydratedState<GroupModel>> build() {
    _startGC();
    ref.onDispose(() => _gcTimer?.cancel());
    return {};
  }

  void _startGC() {
    _gcTimer = Timer.periodic(const Duration(minutes: 1), (_) => _performGC());
  }

  void _performGC() {
    final newState = Map<String, HydratedState<GroupModel>>.from(state);
    bool changed = false;

    _metadata.removeWhere((id, meta) {
      if (meta.tier == EntityTier.cold) {
        newState.remove(id);
        changed = true;
        return true;
      }
      return false;
    });

    if (changed) state = newState;
  }

  // Hydratable implementation wrapper for a specific group
  Hydratable<GroupModel> _createHydratable(String groupId) {
    return _GroupHydratable(groupId, ref, (updatedState) {
      _patch(groupId, updatedState);
    });
  }

  void _patch(String groupId, HydratedState<GroupModel> hydratedState) {
    final current = state[groupId];

    // 1. Monotonic Version Protection
    // If incoming is older than current, reject (unless it's an error)
    if (current != null &&
        hydratedState.lastModifiedAt.isBefore(current.lastModifiedAt) &&
        hydratedState.source != HydrationSource.error) {
      return;
    }

    // 2. Protection: If incoming is stale and we have fresher data, ignore
    if (hydratedState.isStale && current != null && !current.isStale) {
      return;
    }

    // 3. Mutation Integrity
    // If there are pending mutations, preserve the optimistic fields
    var finalData = hydratedState.data;
    if (finalData != null) {
      final journal = ref.read(mutationJournalProvider);
      final pendingMutations = journal.getPendingFor(groupId);

      if (pendingMutations.isNotEmpty && current?.data != null) {
        // Merge strategy: preserve fields that have pending mutations
        // This is a simplified merge - in a real app, you'd use a deep copy
        // and apply only non-mutated fields from hydratedState.data.
        // For now, we protect the entire model if any mutation is pending,
        // or we could implement field-level protection if needed.

        // Let's implement basic field-level protection for 'name' and 'notes'
        final mutatedFields = pendingMutations
            .expand((m) => m.affectedFields ?? <String>{})
            .toSet();

        if (mutatedFields.isNotEmpty) {
          finalData = finalData.copyWith(
            name: mutatedFields.contains('name')
                ? current!.data!.name
                : finalData.name,
            notes: mutatedFields.contains('notes')
                ? current!.data!.notes
                : finalData.notes,
            description: mutatedFields.contains('description')
                ? current!.data!.description
                : finalData.description,
            privacy: mutatedFields.contains('privacy')
                ? current!.data!.privacy
                : finalData.privacy,
            destination: mutatedFields.contains('destination')
                ? current!.data!.destination
                : finalData.destination,
            coverImage: mutatedFields.contains('coverImage')
                ? current!.data!.coverImage
                : finalData.coverImage,
          );
        }
      }
    }

    final newState = Map<String, HydratedState<GroupModel>>.from(state);
    newState[groupId] = hydratedState.copyWith(data: finalData);
    state = newState;

    _metadata[groupId]?.lastAccessedAt = DateTime.now();

    // 4. Trigger Persistence (with coalescing)
    _persistDebounced(groupId, newState[groupId]!);
  }

  final Map<String, Timer> _persistenceTimers = {};

  void _persistDebounced(
    String groupId,
    HydratedState<GroupModel> hydratedState,
  ) {
    _persistenceTimers[groupId]?.cancel();
    _persistenceTimers[groupId] = Timer(const Duration(milliseconds: 500), () {
      if (hydratedState.hasData) {
        final cache = ref.read(localCacheProvider);
        cache.set(
          ApiEndpoints.groupDetails(groupId),
          hydratedState.data!.toJson(),
          ttl: const Duration(hours: 2),
        );
      }
      _persistenceTimers.remove(groupId);
    });
  }

  void subscribe(String groupId) {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    _metadata[groupId]!.lastAccessedAt = DateTime.now();

    // Auto-trigger hydration if not already present or if stale/partial (e.g. from list)
    final current = state[groupId];
    if (current == null ||
        !current.hasData ||
        current.source == HydrationSource.initial ||
        current.source == HydrationSource.memory) {
      ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _createHydratable(groupId),
            priority: TaskPriority.visible,
            initialData: current?.data,
          );
    }
  }

  void unsubscribe(String groupId) {
    final meta = _metadata[groupId];
    if (meta != null && meta.subscriberCount > 0) {
      meta.subscriberCount--;
    }
  }

  // Update a single group from list fetch or other source
  void updateFromList(List<GroupModel> groups) {
    final newState = Map<String, HydratedState<GroupModel>>.from(state);
    for (final group in groups) {
      final existing = newState[group.id];
      // Only update if fresh or if we don't have it
      if (existing == null || existing.source == HydrationSource.initial) {
        newState[group.id] = HydratedState(
          data: group,
          source: HydrationSource.memory,
          lastUpdatedAt: DateTime.now(),
        );
      } else {
        // Progressive patch: preserve existing metadata, just update data
        newState[group.id] = existing.copyWith(data: group);
      }
      _metadata.putIfAbsent(group.id, () => EntityMetadata());
    }
    state = newState;
  }
}

// ─────────────────────────────────────────────
// Hydratable Implementation
// ─────────────────────────────────────────────

class _GroupHydratable implements Hydratable<GroupModel> {
  final String groupId;
  final Ref ref;
  final void Function(HydratedState<GroupModel>) onUpdateCallback;

  _GroupHydratable(this.groupId, this.ref, this.onUpdateCallback);

  @override
  String get hydrationKey => 'group_$groupId';

  @override
  Future<GroupModel?> loadFromDisk() async {
    final cache = ref.read(localCacheProvider);
    final entry = cache.get(ApiEndpoints.groupDetails(groupId));
    if (entry != null && entry.data != null) {
      return GroupModel.fromJson(entry.data as Map<String, dynamic>);
    }
    return null;
  }

  @override
  Future<GroupModel> fetchFromNetwork() async {
    final service = ref.read(groupServiceProvider);
    return service.getGroupDetails(groupId);
  }

  @override
  void onUpdate(HydratedState<GroupModel> state) {
    onUpdateCallback(state);
  }
}

final groupStoreProvider =
    NotifierProvider<GroupStore, Map<String, HydratedState<GroupModel>>>(
      GroupStore.new,
    );

// ─────────────────────────────────────────────
// Member Entity Store
// ─────────────────────────────────────────────

class MemberStore
    extends Notifier<Map<String, HydratedState<List<GroupMember>>>> {
  final Map<String, EntityMetadata> _metadata = {};

  @override
  Map<String, HydratedState<List<GroupMember>>> build() => {};

  void subscribe(String groupId) {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    if (state[groupId] == null) {
      ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _MemberHydratable(groupId, ref, (s) => _patch(groupId, s)),
            priority: TaskPriority.activeTab,
          );
    }
  }

  void unsubscribe(String groupId) {
    if (_metadata[groupId] != null && _metadata[groupId]!.subscriberCount > 0) {
      _metadata[groupId]!.subscriberCount--;
    }
  }

  void _patch(String groupId, HydratedState<List<GroupMember>> hydratedState) {
    final newState = Map<String, HydratedState<List<GroupMember>>>.from(state);
    newState[groupId] = hydratedState;
    state = newState;
  }
}

class _MemberHydratable implements Hydratable<List<GroupMember>> {
  final String groupId;
  final Ref ref;
  final void Function(HydratedState<List<GroupMember>>) onUpdateCallback;

  _MemberHydratable(this.groupId, this.ref, this.onUpdateCallback);

  @override
  String get hydrationKey => 'members_$groupId';

  @override
  Future<List<GroupMember>?> loadFromDisk() async {
    final cache = ref.read(localCacheProvider);
    final entry = cache.get(ApiEndpoints.groupMembers(groupId));
    if (entry != null && entry.data is List) {
      return (entry.data as List).map((e) => GroupMember.fromJson(e)).toList();
    }
    return null;
  }

  @override
  Future<List<GroupMember>> fetchFromNetwork() async {
    return ref.read(groupServiceProvider).getGroupMembers(groupId);
  }

  @override
  void onUpdate(HydratedState<List<GroupMember>> state) =>
      onUpdateCallback(state);
}

final memberStoreProvider =
    NotifierProvider<
      MemberStore,
      Map<String, HydratedState<List<GroupMember>>>
    >(MemberStore.new);

// ─────────────────────────────────────────────
// Itinerary Entity Store
// ─────────────────────────────────────────────

class ItineraryStore
    extends Notifier<Map<String, HydratedState<List<ItineraryItem>>>> {
  final Map<String, EntityMetadata> _metadata = {};

  @override
  Map<String, HydratedState<List<ItineraryItem>>> build() => {};

  void subscribe(String groupId) {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    if (state[groupId] == null) {
      ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _ItineraryHydratable(groupId, ref, (s) => _patch(groupId, s)),
            priority: TaskPriority.activeTab,
          );
    }
  }

  void unsubscribe(String groupId) {
    if (_metadata[groupId] != null && _metadata[groupId]!.subscriberCount > 0) {
      _metadata[groupId]!.subscriberCount--;
    }
  }

  void _patch(
    String groupId,
    HydratedState<List<ItineraryItem>> hydratedState,
  ) {
    final newState = Map<String, HydratedState<List<ItineraryItem>>>.from(
      state,
    );
    newState[groupId] = hydratedState;
    state = newState;
  }
}

class _ItineraryHydratable implements Hydratable<List<ItineraryItem>> {
  final String groupId;
  final Ref ref;
  final void Function(HydratedState<List<ItineraryItem>>) onUpdateCallback;

  _ItineraryHydratable(this.groupId, this.ref, this.onUpdateCallback);

  @override
  String get hydrationKey => 'itinerary_$groupId';

  @override
  Future<List<ItineraryItem>?> loadFromDisk() async {
    final cache = ref.read(localCacheProvider);
    final entry = cache.get(ApiEndpoints.groupItinerary(groupId));
    if (entry != null && entry.data is List) {
      return (entry.data as List)
          .map((e) => ItineraryItem.fromJson(e))
          .toList();
    }
    return null;
  }

  @override
  Future<List<ItineraryItem>> fetchFromNetwork() async {
    return ref.read(groupServiceProvider).getGroupItinerary(groupId);
  }

  @override
  void onUpdate(HydratedState<List<ItineraryItem>> state) =>
      onUpdateCallback(state);
}

final itineraryStoreProvider =
    NotifierProvider<
      ItineraryStore,
      Map<String, HydratedState<List<ItineraryItem>>>
    >(ItineraryStore.new);

// ─────────────────────────────────────────────
// Membership Entity Store
// ─────────────────────────────────────────────

class MembershipStore
    extends Notifier<Map<String, HydratedState<MembershipInfo>>> {
  final Map<String, EntityMetadata> _metadata = {};

  @override
  Map<String, HydratedState<MembershipInfo>> build() => {};

  void subscribe(String groupId) {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    if (state[groupId] == null) {
      ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _MembershipHydratable(groupId, ref, (s) => _patch(groupId, s)),
            priority: TaskPriority.visible,
          );
    }
  }

  void unsubscribe(String groupId) {
    if (_metadata[groupId] != null && _metadata[groupId]!.subscriberCount > 0) {
      _metadata[groupId]!.subscriberCount--;
    }
  }

  void _patch(String groupId, HydratedState<MembershipInfo> hydratedState) {
    final newState = Map<String, HydratedState<MembershipInfo>>.from(state);
    newState[groupId] = hydratedState;
    state = newState;
  }
}

class _MembershipHydratable implements Hydratable<MembershipInfo> {
  final String groupId;
  final Ref ref;
  final void Function(HydratedState<MembershipInfo>) onUpdateCallback;

  _MembershipHydratable(this.groupId, this.ref, this.onUpdateCallback);

  @override
  String get hydrationKey => 'membership_$groupId';

  @override
  Future<MembershipInfo?> loadFromDisk() async {
    final cache = ref.read(localCacheProvider);
    final entry = cache.get(ApiEndpoints.groupMembership(groupId));
    if (entry != null && entry.data != null) {
      return MembershipInfo.fromJson(entry.data as Map<String, dynamic>);
    }
    return null;
  }

  @override
  Future<MembershipInfo> fetchFromNetwork() async {
    return ref.read(groupServiceProvider).getGroupMembership(groupId);
  }

  @override
  void onUpdate(HydratedState<MembershipInfo> state) => onUpdateCallback(state);
}

final membershipStoreProvider =
    NotifierProvider<
      MembershipStore,
      Map<String, HydratedState<MembershipInfo>>
    >(MembershipStore.new);

class MyGroupsStore extends Hydratable<List<GroupModel>> {
  final Ref ref;
  MyGroupsStore(this.ref);

  @override
  String get hydrationKey => 'my_groups';

  @override
  Future<List<GroupModel>?> loadFromDisk() async {
    final cache = ref.read(localCacheProvider);
    final cached = cache.get(ApiEndpoints.myGroups);
    if (cached != null) {
      return ref.read(groupServiceProvider).parseGroups(cached.data);
    }
    return null;
  }

  @override
  Future<List<GroupModel>> fetchFromNetwork() async {
    return ref.read(groupServiceProvider).getMyGroups();
  }

  @override
  void onUpdate(HydratedState<List<GroupModel>> state) {
    if (state.hasData) {
      // Seed the individual group stores for instant detail navigation
      ref.read(groupStoreProvider.notifier).updateFromList(state.data!);
    }
  }
}

final myGroupsStoreProvider =
    StateNotifierProvider<
      HydrationEngineWrapper<List<GroupModel>>,
      HydratedState<List<GroupModel>>
    >((ref) {
      final store = MyGroupsStore(ref);
      final engine = ref.read(hydrationEngineProvider);
      final wrapper = HydrationEngineWrapper(engine, store);

      // Initial hydration
      Future.microtask(() => wrapper.hydrate());

      return wrapper;
    });

class HydrationEngineWrapper<T> extends StateNotifier<HydratedState<T>> {
  final HydrationEngine _engine;
  final Hydratable<T> _target;
  StreamSubscription? _subscription;

  HydrationEngineWrapper(this._engine, this._target) : super(HydratedState());

  Future<void> refresh() async {
    hydrate(force: true);
    // Wait for the next network hit or error (isHydrating becomes false)
    await _engine.hydrate(_target).firstWhere((s) => !s.isHydrating);
  }

  void hydrate({bool force = false}) {
    _subscription?.cancel();
    _subscription = _engine.hydrate(_target, force: force).listen((state) {
      this.state = state;
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
