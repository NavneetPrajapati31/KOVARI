import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'hydration_engine.dart';
import 'runtime_scheduler.dart';
import 'replay_engine.dart';
import '../utils/app_logger.dart';

class RuntimeCoordinator {
  final HydrationEngine _hydrationEngine;
  final RuntimeScheduler _scheduler;
  final ReplayEngine _replayEngine;

  RuntimeCoordinator(this._hydrationEngine, this._scheduler, this._replayEngine);

  void requestHydration<T>(
    Hydratable<T> target, {
    TaskPriority priority = TaskPriority.nearby,
    T? initialData,
  }) {
    _scheduler.schedule(
      HydrationTask(
        id: 'hydrate_${target.hydrationKey}',
        priority: priority,
        execute: () async {
          AppLogger.d(
            '🔄 [RuntimeCoordinator] Starting hydration for ${target.hydrationKey}',
          );
          await _hydrationEngine
              .hydrate(target, initialData: initialData)
              .firstWhere((state) => !state.isHydrating);
        },
      ),
    );
  }

  /// High-level replay restoration
  void persistState(String key, Map<String, dynamic> metadata) => _replayEngine.persist(key, metadata);
  
  Map<String, dynamic>? restoreState(String key) => _replayEngine.restore(key)?.metadata;

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
