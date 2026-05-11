import 'dart:async';
import 'package:flutter/scheduler.dart';
import 'runtime_metrics_service.dart';

class FreezeMonitor {
  static const int _freezeThresholdMs = 700;
  static const Duration _checkInterval = Duration(milliseconds: 500);
  
  Timer? _timer;
  int _lastTick = DateTime.now().millisecondsSinceEpoch;

  void start() {
    _timer = Timer.periodic(_checkInterval, (timer) {
      final now = DateTime.now().millisecondsSinceEpoch;
      final elapsed = now - _lastTick;

      if (elapsed > _freezeThresholdMs) {
        RuntimeMetricsService().reportFreeze(elapsed);
      }
      
      _lastTick = now;
    });

    // Reset tick on every frame to ensure we only catch REAL blocks
    SchedulerBinding.instance.addPersistentFrameCallback((_) {
      _lastTick = DateTime.now().millisecondsSinceEpoch;
    });
  }

  void stop() {
    _timer?.cancel();
  }
}
