import 'dart:async';
import '../utils/app_logger.dart';
import '../../features/groups/models/hydrated_state.dart';

abstract class Hydratable<T> {
  String get hydrationKey;
  Future<T?> loadFromDisk();
  Future<T> fetchFromNetwork();
  void onUpdate(HydratedState<T> state);
}

class HydrationEngine {
  final Map<String, StreamController<HydratedState<dynamic>>> _controllers = {};
  final Map<String, HydratedState<dynamic>> _lastStates = {};

  Stream<HydratedState<T>> hydrate<T>(
    Hydratable<T> target, {
    T? initialData,
    bool force = false,
  }) async* {
    final key = target.hydrationKey;

    if (force) {
      _controllers.remove(key);
      _lastStates.remove(key);
    }

    StreamController<HydratedState<T>>? controller;

    if (_controllers.containsKey(key)) {
      controller = _controllers[key]! as StreamController<HydratedState<T>>;
    } else {
      controller = StreamController<HydratedState<T>>.broadcast();
      _controllers[key] = controller;
      // Start sequence but don't await here
      _runHydrationSequence(target, controller, initialData);
    }

    // 🛡️ REPLAY FIX: Always yield the last known state first if it exists
    if (_lastStates.containsKey(key)) {
      yield _lastStates[key]! as HydratedState<T>;
    } else if (initialData != null) {
      yield HydratedState(
        data: initialData,
        source: HydrationSource.initial,
        isHydrating: true,
      );
    }

    // Then pipe all future events
    yield* controller.stream;
  }

  Future<void> _runHydrationSequence<T>(
    Hydratable<T> target,
    StreamController<HydratedState<T>> controller,
    T? initialData,
  ) async {
    HydratedState<T> currentState = HydratedState(
      data: initialData,
      source: HydrationSource.initial,
      isHydrating: true,
    );

    void emit(HydratedState<T> next) {
      currentState = next;
      _lastStates[target.hydrationKey] = next;
      controller.add(next);
      target.onUpdate(next);
    }

    // 1. Emit Initial/Memory
    if (initialData != null) {
      emit(currentState.copyWith(source: HydrationSource.memory));
    }

    // 2. Try Disk (Hive)
    try {
      final diskData = await target.loadFromDisk();
      if (diskData != null) {
        AppLogger.d('📦 [HydrationEngine] Disk hit for ${target.hydrationKey}');
        emit(currentState.copyWith(
          data: diskData,
          source: HydrationSource.disk,
        ));
      }
    } catch (e) {
      AppLogger.e('⚠️ [HydrationEngine] Disk load failed for ${target.hydrationKey}: $e');
    }

    // 3. Network Fetch
    try {
      final networkData = await target.fetchFromNetwork();
      AppLogger.d('📡 [HydrationEngine] Network success for ${target.hydrationKey}');
      emit(currentState.copyWith(
        data: networkData,
        source: HydrationSource.network,
        isHydrating: false,
        lastUpdatedAt: DateTime.now(),
      ));
    } catch (e) {
      AppLogger.e('❌ [HydrationEngine] Network failed for ${target.hydrationKey}: $e');
      emit(currentState.copyWith(
        source: currentState.hasData ? HydrationSource.stale : HydrationSource.error,
        isHydrating: false,
        error: e.toString(),
        // Preserve data if we have it
        data: currentState.data,
      ));
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
