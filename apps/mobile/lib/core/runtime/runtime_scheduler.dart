import 'dart:async';
import 'package:flutter/foundation.dart';
import '../utils/app_logger.dart';

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
  final TaskPriority priority;
  final ViewportContext? viewport;
  final Future<void> Function() execute;
  final VoidCallback? onCancel;

  HydrationTask({
    required this.id,
    required this.priority,
    this.viewport,
    required this.execute,
    this.onCancel,
  });
}

class RuntimeScheduler {
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
    }
  }

  void cancel(String taskId) {
    _queue.removeWhere((t) {
      if (t.id == taskId) {
        t.onCancel?.call();
        return true;
      }
      return false;
    });
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

    try {
      await task.execute();
    } catch (e) {
      AppLogger.e('❌ [RuntimeScheduler] Task ${task.id} failed: $e');
    } finally {
      _runningCount--;
      _activeTaskIds.remove(task.id);
      _processQueue();
    }
  }

  // Metrics for Debug Overlay
  int get queueDepth => _queue.length;
  int get activeCount => _runningCount;
}

// Global or Provider-managed instance
// In this migration, we'll expose it via Riverpod
