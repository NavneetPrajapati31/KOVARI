import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:mobile/core/telemetry/telemetry_priority.dart';
import 'package:mobile/core/telemetry/telemetry_service.dart';

class RuntimeMetricsService {
  factory RuntimeMetricsService() => _instance;
  RuntimeMetricsService._internal();
  static final RuntimeMetricsService _instance = RuntimeMetricsService._internal();

  DateTime? _appStartTime;
  bool _firstFrameRendered = false;

  void markAppStart() {
    _appStartTime = DateTime.now();
  }

  void init() {
    // 1. Cold Start Tracking
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!_firstFrameRendered) {
        _firstFrameRendered = true;
        _reportColdStart();
      }
    });

    // 2. Frame & Jank Tracking
    if (kReleaseMode) {
      SchedulerBinding.instance.addTimingsCallback(_onFrameTimings);
    }
  }

  void _reportColdStart() {
    if (_appStartTime == null) return;
    
    final duration = DateTime.now().difference(_appStartTime!);
    TelemetryService().logEvent(
      'app_cold_start',
      priority: TelemetryPriority.high,
      parameters: {
        'duration_ms': duration.inMilliseconds,
      },
    );
  }

  void _onFrameTimings(List<FrameTiming> timings) {
    for (final timing in timings) {
      final buildTime = timing.buildDuration.inMilliseconds;
      final rasterTime = timing.rasterDuration.inMilliseconds;
      final totalTime = timing.totalSpan.inMilliseconds;

      // Detect Jank: If total time > 16.6ms (60fps) or 8.3ms (120fps)
      if (totalTime > 17) {
        TelemetryService().logEvent(
          'frame_jank_detected',
          priority: TelemetryPriority.low,
          parameters: {
            'build_ms': buildTime,
            'raster_ms': rasterTime,
            'total_ms': totalTime,
          },
        );
      }
    }
  }

  // ❄️ Freeze Monitor integration (placeholder)
  void reportFreeze(int durationMs) {
    TelemetryService().logEvent(
      'runtime_freeze_detected',
      priority: TelemetryPriority.critical,
      parameters: {
        'duration_ms': durationMs,
      },
    );
  }
}
