import 'dart:async';
import 'package:flutter/foundation.dart';
import '../utils/app_logger.dart';
import '../telemetry/telemetry_service.dart';
import '../telemetry/telemetry_priority.dart';
import '../telemetry/event_schema_registry.dart';

enum TaskPriority {
  visible, // Currently on screen
  activeTab, // Not visible but in active screen stack
  likelyNext, // High probability of navigation
  nearby, // Nearby in a scrollable list
  warming, // Background cache warming
}

class ViewportContext {
  final double scrollOffset;
  final int itemIndex;
  final bool isVisible;

  ViewportContext({
    this.scrollOffset = 0,
    this.itemIndex = 0,
    this.isVisible = false,
  });
}

class HydrationTask {
  final String id;
  final String? traceId;
  final TaskPriority priority;
  final ViewportContext? viewport;
  final Future<void> Function() execute;
  final VoidCallback? onCancel;

  HydrationTask({
    required this.id,
    this.traceId,
    required this.priority,
    this.viewport,
    required this.execute,
    this.onCancel,
  });
}

class RuntimeScheduler extends ChangeNotifier {
  static const int _maxConcurrentTasks = 3;

  final List<HydrationTask> _queue = [];
  final Set<String> _activeTaskIds = {};
  int _runningCount = 0;

  // Adaptive pressure metrics
  bool _isHighVelocityScroll = false;

  void schedule(HydrationTask task) {
    // Deduplicate: If same task is already queued or running, ignore or upgrade priority
    if (_activeTaskIds.contains(task.id)) {
      _upgradePriority(task.id, task.priority);
      return;
    }

    _queue.add(task);
    _sortQueue();
    notifyListeners();
    _processQueue();
  }

  void setScrollVelocity(double velocity) {
    final highVelocity = velocity.abs() > 2000;
    if (_isHighVelocityScroll != highVelocity) {
      _isHighVelocityScroll = highVelocity;
      if (_isHighVelocityScroll) {
        AppLogger.d(
          '🚀 [RuntimeScheduler] High velocity detected. Throttling non-visible hydration.',
        );
      }

      // Log Pressure Transition
      TelemetryService().logEvent(
        EventSchemaRegistry.pressureTransition,
        priority: TelemetryPriority.high,
        parameters: {
          'type': 'scroll_velocity',
          'is_high_pressure': _isHighVelocityScroll,
          'velocity': velocity.abs(),
          'queue_depth': _queue.length,
        },
      );

      _processQueue();
    }
  }

  void _upgradePriority(String taskId, TaskPriority newPriority) {
    final index = _queue.indexWhere((t) => t.id == taskId);
    if (index != -1 && _queue[index].priority.index > newPriority.index) {
      _queue[index] = HydrationTask(
        id: taskId,
        priority: newPriority,
        execute: _queue[index].execute,
        onCancel: _queue[index].onCancel,
      );
      _sortQueue();
      notifyListeners();
    }
  }

  void cancel(String taskId) {
    bool removed = false;
    _queue.removeWhere((t) {
      if (t.id == taskId) {
        t.onCancel?.call();
        removed = true;
        return true;
      }
      return false;
    });

    if (removed) {
      notifyListeners();
    }
    _activeTaskIds.remove(taskId);
  }

  void _sortQueue() {
    _queue.sort((a, b) => a.priority.index.compareTo(b.priority.index));
  }

  Future<void> _processQueue() async {
    if (_runningCount >= _maxConcurrentTasks || _queue.isEmpty) return;

    // Filter tasks based on pressure
    final nextTaskIndex = _queue.indexWhere((t) {
      if (_isHighVelocityScroll && t.priority != TaskPriority.visible) {
        return false; // Only allow visible tasks during fling
      }
      return true;
    });

    if (nextTaskIndex == -1) return;

    final task = _queue.removeAt(nextTaskIndex);
    _activeTaskIds.add(task.id);
    _runningCount++;
    notifyListeners();

    final stopwatch = Stopwatch()..start();
    final telemetry = TelemetryService();

    // Set current trace ID if task has one
    if (task.traceId != null) {
      telemetry.startTrace(task.traceId!);
    }

    try {
      await task.execute();

      // Log Success Telemetry
      telemetry.logEvent(
        EventSchemaRegistry.hydrationTask,
        priority: TelemetryPriority.low,
        parameters: {
          'task_id': task.id,
          'priority': task.priority.name,
          'duration_ms': stopwatch.elapsedMilliseconds,
          'queue_depth': _queue.length,
          'status': 'success',
        },
      );
    } catch (e) {
      AppLogger.e('❌ [RuntimeScheduler] Task ${task.id} failed: $e');

      // Log Failure Telemetry
      telemetry.logEvent(
        EventSchemaRegistry.hydrationTask,
        priority: TelemetryPriority.high,
        parameters: {
          'task_id': task.id,
          'priority': task.priority.name,
          'duration_ms': stopwatch.elapsedMilliseconds,
          'status': 'failed',
          'error': e.toString(),
        },
      );
    } finally {
      _runningCount--;
      _activeTaskIds.remove(task.id);
      notifyListeners();
      _processQueue();
    }
  }

  // Metrics for Debug Overlay
  int get queueDepth => _queue.length;
  int get activeCount => _runningCount;
}

// Global or Provider-managed instance
// In this migration, we'll expose it via Riverpod
