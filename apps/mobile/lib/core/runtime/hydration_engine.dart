import 'dart:async';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/groups/models/hydrated_state.dart';

abstract class Hydratable<T> {
  String get hydrationKey;
  Future<T?> loadFromDisk();
  Future<T> fetchFromNetwork();
  void onUpdate(HydratedState<T> state);
}

class HydrationEngine {
  final Map<String, StreamController<HydratedState<dynamic>>> _controllers = {};
  final Map<String, HydratedState<dynamic>> _lastStates = {};
  
  void updateLastState(String key, HydratedState<dynamic> state) {
    _lastStates[key] = state;
  }

  Stream<HydratedState<T>> hydrate<T>(
    Hydratable<T> target, {
    T? initialData,
    bool force = false,
  }) async* {
    final key = target.hydrationKey;

    if (force) {
      _controllers.remove(key);
      // 🛡️ SWR Protection: Preserve last state but mark as hydrating for the replay
      final lastState = _lastStates[key];
      if (lastState != null) {
        _lastStates[key] = lastState.copyWith(
          isHydrating: true,
          source: HydrationSource.stale,
          lastModifiedAt: DateTime.now(),
        );
      }
    }

    StreamController<HydratedState<T>>? controller;

    if (_controllers.containsKey(key)) {
      controller = _controllers[key]! as StreamController<HydratedState<T>>;
    } else {
      controller = StreamController<HydratedState<T>>.broadcast();
      _controllers[key] = controller;
      
      // 🛡️ SWR Protection: Pass the last data as initialData to the sequence
      final lastData = (_lastStates[key]?.data as T?) ?? initialData;
      _runHydrationSequence(target, controller, lastData);
    }

    // 🛡️ REPLAY FIX: Always yield the last known state first if it exists
    final firstState = _lastStates[key] as HydratedState<T>?;
    if (firstState != null) {
      yield firstState;
    } else {
      yield HydratedState(
        data: initialData,
        isHydrating: true,
      );
    }

    // 🛡️ RACE CONDITION PROTECTION: Re-check the latest state just before piping the stream
    // This ensures that if _runHydrationSequence updated the state between our first yield
    // and the stream connection, we don't miss that update.
    final latestState = _lastStates[key] as HydratedState<T>?;
    if (latestState != null && latestState != firstState) {
      yield latestState;
    }

    // Then pipe all future events
    yield* controller.stream;
  }

  Future<void> _runHydrationSequence<T>(
    Hydratable<T> target,
    StreamController<HydratedState<T>> controller,
    T? initialData,
  ) async {
    var currentState = HydratedState<T>(
      data: initialData,
      isHydrating: true,
    );

    void emit(HydratedState<T> next) {
      currentState = next;
      _lastStates[target.hydrationKey] = next;
      controller.add(next);
      target.onUpdate(next);
    }

    // 1. Emit Initial State IMMEDIATELY to notify subscribers that hydration started
    emit(currentState);

    // 2. Try Disk (Hive)
    try {
      final diskData = await target.loadFromDisk();
      if (diskData != null) {
        AppLogger.d('📦 [HydrationEngine] Disk hit for ${target.hydrationKey}');
        emit(
          currentState.copyWith(data: diskData, source: HydrationSource.disk),
        );
      }
    } catch (e) {
      AppLogger.e(
        '⚠️ [HydrationEngine] Disk load failed for ${target.hydrationKey}: $e',
      );
    }

    // 3. Network Fetch
    try {
      final networkData = await target.fetchFromNetwork();
      AppLogger.d(
        '📡 [HydrationEngine] Network success for ${target.hydrationKey}',
      );
      emit(
        currentState.copyWith(
          data: networkData,
          source: HydrationSource.network,
          isHydrating: false,
          lastUpdatedAt: DateTime.now(),
        ),
      );
    } catch (e) {
      AppLogger.e(
        '❌ [HydrationEngine] Network failed for ${target.hydrationKey}: $e',
      );
      emit(
        currentState.copyWith(
          source: currentState.hasData
              ? HydrationSource.stale
              : HydrationSource.error,
          isHydrating: false,
          error: e.toString(),
          // Preserve data if we have it
          data: currentState.data,
        ),
      );
    } finally {
      // Keep controller alive for a while to allow other subscribers to join
      // but clean up if no listeners after some time
      Future.delayed(const Duration(minutes: 5), () {
        if (!controller.hasListener) {
          _controllers.remove(target.hydrationKey);
          controller.close();
        }
      });
    }
  }
}
