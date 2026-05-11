import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:mobile/core/runtime/hydration_engine.dart';
import 'package:mobile/core/runtime/replay_engine.dart';
import 'package:mobile/core/runtime/runtime_scheduler.dart';
import 'package:mobile/core/telemetry/telemetry_service.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/groups/models/hydrated_state.dart';

class RuntimeCoordinator {

  RuntimeCoordinator(
    this._hydrationEngine,
    this._scheduler,
    this._replayEngine,
  );
  final HydrationEngine _hydrationEngine;
  final RuntimeScheduler _scheduler;
  final ReplayEngine _replayEngine;

  Stream<HydratedState<T>> requestHydration<T>(
    Hydratable<T> target, {
    TaskPriority priority = TaskPriority.nearby,
    T? initialData,
    bool force = false,
    String? traceId,
  }) {
    final effectiveTraceId = traceId ?? TelemetryService().currentTraceId;
    // 🛡️ Get the stream from the engine
    final stream = _hydrationEngine.hydrate(
      target,
      initialData: initialData,
      force: force,
    );

    _scheduler.schedule(
      HydrationTask(
        id: 'hydrate_${target.hydrationKey}',
        traceId: effectiveTraceId,
        priority: priority,
        execute: () async {
          AppLogger.d(
            '🔄 [RuntimeCoordinator] Starting hydration for ${target.hydrationKey} (force: $force)',
          );

          // 🛡️ RACE CONDITION FIX:
          // If hydration already finished (isHydrating is false), don't wait.
          // Broadcast streams don't replay, so we'd hang forever otherwise.
          try {
            await stream
                .firstWhere((state) => !state.isHydrating)
                .timeout(const Duration(seconds: 10));
          } catch (e) {
            AppLogger.e(
              '⚠️ Hydration wait timed out or finished early for ${target.hydrationKey}',
            );
          }
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
final runtimeSchedulerProvider = ChangeNotifierProvider(
  (ref) => RuntimeScheduler(),
);
final replayEngineProvider = Provider((ref) => ReplayEngine());

final runtimeCoordinatorProvider = Provider((ref) {
  final hydration = ref.watch(hydrationEngineProvider);
  final scheduler = ref.watch(runtimeSchedulerProvider);
  final replay = ref.watch(replayEngineProvider);
  return RuntimeCoordinator(hydration, scheduler, replay);
});
