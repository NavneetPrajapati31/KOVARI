import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/groups/models/hydrated_state.dart';
import 'hydration_engine.dart';
import 'runtime_scheduler.dart';
import 'replay_engine.dart';
import '../utils/app_logger.dart';

class RuntimeCoordinator {
  final HydrationEngine _hydrationEngine;
  final RuntimeScheduler _scheduler;
  final ReplayEngine _replayEngine;

  RuntimeCoordinator(
    this._hydrationEngine,
    this._scheduler,
    this._replayEngine,
  );

  Stream<HydratedState<T>> requestHydration<T>(
    Hydratable<T> target, {
    TaskPriority priority = TaskPriority.nearby,
    T? initialData,
    bool force = false,
  }) {
    // 🛡️ Return the stream immediately so listeners can bind to it
    final stream = _hydrationEngine.hydrate(
      target,
      initialData: initialData,
      force: force,
    );

    _scheduler.schedule(
      HydrationTask(
        id: 'hydrate_${target.hydrationKey}',
        priority: priority,
        execute: () async {
          AppLogger.d(
            '🔄 [RuntimeCoordinator] Starting hydration for ${target.hydrationKey} (force: $force)',
          );
          // Wait for the hydration sequence (disk + network) to complete
          await stream.firstWhere((state) => !state.isHydrating);
        },
      ),
    );

    return stream;
  }

  /// High-level replay restoration
  void persistState(String key, Map<String, dynamic> metadata) =>
      _replayEngine.persist(key, metadata);

  Map<String, dynamic>? restoreState(String key) =>
      _replayEngine.restore(key)?.metadata;

  // Accessors for UI to bind to scheduler metrics if needed
  RuntimeScheduler get scheduler => _scheduler;
}

// Providers for the core engines
final hydrationEngineProvider = Provider((ref) => HydrationEngine());
final runtimeSchedulerProvider = Provider((ref) => RuntimeScheduler());
final replayEngineProvider = Provider((ref) => ReplayEngine());

final runtimeCoordinatorProvider = Provider((ref) {
  final hydration = ref.watch(hydrationEngineProvider);
  final scheduler = ref.watch(runtimeSchedulerProvider);
  final replay = ref.watch(replayEngineProvider);
  return RuntimeCoordinator(hydration, scheduler, replay);
});
