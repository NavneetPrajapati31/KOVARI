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

  Stream<HydratedState<T>> hydrate<T>(
    Hydratable<T> target, {
    T? initialData,
    bool force = false,
  }) {
    final key = target.hydrationKey;

    if (force) {
      _controllers.remove(key);
    }

    // If already hydrating, return existing stream
    if (_controllers.containsKey(key)) {
      return _controllers[key]!.stream as Stream<HydratedState<T>>;
    }

    final controller = StreamController<HydratedState<T>>.broadcast();
    _controllers[key] = controller;

    _runHydrationSequence(target, controller, initialData);

    return controller.stream;
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
