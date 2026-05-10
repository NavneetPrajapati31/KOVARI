import 'dart:async';
import 'package:flutter/foundation.dart';
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

    // 3. Progressive Merge & Mutation Integrity
    var finalData = hydratedState.data;

    if (finalData != null && current?.data != null) {
      final existingData = current!.data!;

      // 🛡️ Progressive Merge: Preserve high-fidelity fields if incoming is null/empty
      finalData = finalData.copyWith(
        destinationImage: (finalData.destinationImage?.isEmpty ?? true)
            ? existingData.destinationImage
            : finalData.destinationImage,
        description: (finalData.description?.isEmpty ?? true)
            ? existingData.description
            : finalData.description,
        notes: (finalData.notes?.isEmpty ?? true)
            ? existingData.notes
            : finalData.notes,
        coverImage: (finalData.coverImage?.isEmpty ?? true)
            ? existingData.coverImage
            : finalData.coverImage,
      );

      // 🛡️ Mutation Protection: Preserve fields with pending local edits
      final journal = ref.read(mutationJournalProvider);
      final pendingMutations = journal.getPendingFor(groupId);
      if (pendingMutations.isNotEmpty) {
        final mutatedFields = pendingMutations
            .expand((m) => m.affectedFields ?? <String>{})
            .toSet();
        if (mutatedFields.isNotEmpty) {
          finalData = finalData.copyWith(
            name: mutatedFields.contains('name')
                ? existingData.name
                : finalData.name,
            destination: mutatedFields.contains('destination')
                ? existingData.destination
                : finalData.destination,
            notes: mutatedFields.contains('notes')
                ? existingData.notes
                : finalData.notes,
          );
        }
      }
    }

    if (kDebugMode && finalData?.destinationImage != null) {
      debugPrint(
        '🛰️ [GroupStore._patch] Applying state with image: ${finalData?.destinationImage}',
      );
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

  Future<void> subscribe(String groupId, {bool force = false}) async {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    _metadata[groupId]!.lastAccessedAt = DateTime.now();

    // Auto-trigger hydration if not already present or if stale/partial (e.g. from list)
    final current = state[groupId];
    if (current == null ||
        !current.hasData ||
        current.source == HydrationSource.initial ||
        current.source == HydrationSource.memory ||
        force) {
      final stream = ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _createHydratable(groupId),
            priority: TaskPriority.visible,
            initialData: current?.data,
            force: force,
          );
      try {
        await stream
            .firstWhere((s) => !s.isHydrating)
            .timeout(const Duration(seconds: 10));
      } catch (e) {
        debugPrint(
          '⚠️ [GroupStore] Hydration wait timed out or finished early',
        );
      }
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
    for (final group in groups) {
      final current = state[group.id];

      // 🛡️ High-Fidelity Protection: Never let a thin list update wipe out a rich detail image
      final existingImg = current?.data?.destinationImage;
      final incomingImg = group.destinationImage;
      final preservedImg =
          (incomingImg == null || incomingImg.isEmpty) &&
              (existingImg != null && existingImg.isNotEmpty)
          ? existingImg
          : incomingImg;

      final mergedData = group.copyWith(
        destinationImage: preservedImg,
        // Preserve other rich fields if missing in list
        description: group.description ?? current?.data?.description,
        notes: group.notes ?? current?.data?.notes,
        coverImage: (group.coverImage == null || group.coverImage!.isEmpty)
            ? current?.data?.coverImage
            : group.coverImage,
      );

      if (kDebugMode &&
          (existingImg != null &&
              existingImg.isNotEmpty &&
              (incomingImg == null || incomingImg.isEmpty))) {
        debugPrint(
          '   🛡️ [MERGE] Preserved existing image URL ($existingImg)',
        );
      }

      _patch(
        group.id,
        HydratedState(
          data: mergedData,
          source: HydrationSource.memory,
          lastUpdatedAt: DateTime.now(),
          lastModifiedAt: DateTime.now(),
        ),
      );
    }
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

  Future<void> subscribe(String groupId, {bool force = false}) async {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    if (state[groupId] == null || force) {
      final stream = ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _MemberHydratable(groupId, ref, (s) => _patch(groupId, s)),
            priority: TaskPriority.activeTab,
            force: force,
          );
      try {
        await stream
            .firstWhere((s) => !s.isHydrating)
            .timeout(const Duration(seconds: 10));
      } catch (e) {
        debugPrint(
          '⚠️ [MemberStore] Hydration wait timed out or finished early',
        );
      }
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

  Future<void> subscribe(String groupId, {bool force = false}) async {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    if (state[groupId] == null || force) {
      final stream = ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _ItineraryHydratable(groupId, ref, (s) => _patch(groupId, s)),
            priority: TaskPriority.activeTab,
            force: force,
          );
      try {
        await stream
            .firstWhere((s) => !s.isHydrating)
            .timeout(const Duration(seconds: 10));
      } catch (e) {
        debugPrint(
          '⚠️ [ItineraryStore] Hydration wait timed out or finished early',
        );
      }
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

  Future<void> subscribe(String groupId, {bool force = false}) async {
    _metadata.putIfAbsent(groupId, () => EntityMetadata()).subscriberCount++;
    if (state[groupId] == null || force) {
      final stream = ref
          .read(runtimeCoordinatorProvider)
          .requestHydration(
            _MembershipHydratable(groupId, ref, (s) => _patch(groupId, s)),
            priority: TaskPriority.visible,
            force: force,
          );
      try {
        await stream
            .firstWhere((s) => !s.isHydrating)
            .timeout(const Duration(seconds: 10));
      } catch (e) {
        debugPrint(
          '⚠️ [MembershipStore] Hydration wait timed out or finished early',
        );
      }
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
    debugPrint(
      '📡 [MyGroupsStore] Initiating network fetch from: ${ApiEndpoints.myGroups}',
    );
    return ref.read(groupServiceProvider).getMyGroups();
  }

  Future<void> refresh() async {
    // 🚀 FORCE: bypass disk cache to fetch the new destination_image keys from backend
    // We call hydrate with force: true which triggers a fresh network sequence
    ref.read(hydrationEngineProvider).hydrate(this, force: true);
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
    // 🛡️ RACE CONDITION FIX: Subscribe to the stream BEFORE triggering the force-load
    // This ensures we catch the '!isHydrating' event even if it happens instantly.
    final future = _engine
        .hydrate(_target, force: true)
        .firstWhere((s) => !s.isHydrating);

    hydrate(force: true);

    await future;
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
