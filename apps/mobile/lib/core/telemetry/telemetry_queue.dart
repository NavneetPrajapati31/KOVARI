import 'dart:convert';
import 'package:hive/hive.dart';
import 'telemetry_budget.dart';
import 'telemetry_priority.dart';

class TelemetryQueue {
  static const String boxName = 'telemetry_queue';
  Box? _box;
  bool _isInitialized = false;

  Future<void> init() async {
    _box = await Hive.openBox(boxName);
    _isInitialized = true;
    await _cleanupOldEvents();
  }

  Future<void> enqueue(Map<String, dynamic> event, TelemetryPriority priority) async {
    if (!_isInitialized || _box == null) return;

    if (_box!.length >= TelemetryBudget.maxQueueSize) {
      if (priority == TelemetryPriority.critical) {
        // Evict oldest non-critical event to make room
        await _evictLowPriority();
      } else {
        // Drop new event if queue is full
        return;
      }
    }

    final id = DateTime.now().microsecondsSinceEpoch.toString();
    await _box!.put(id, {
      'timestamp': DateTime.now().toIso8601String(),
      'priority': priority.name,
      'payload': jsonEncode(event),
    });
  }

  List<Map<String, dynamic>> peekBatch(int batchSize) {
    if (!_isInitialized || _box == null) return [];

    return _box!.values
        .take(batchSize)
        .cast<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Future<void> removeIds(List<String> ids) async {
    if (!_isInitialized || _box == null) return;
    await _box!.deleteAll(ids);
  }

  Future<void> _cleanupOldEvents() async {
    if (!_isInitialized || _box == null) return;
    // TTL enforcement: 7 days
    final now = DateTime.now();
    final expiredIds = <String>[];

    for (var key in _box!.keys) {
      final event = _box!.get(key) as Map;
      final timestamp = DateTime.parse(event['timestamp'] as String);
      if (now.difference(timestamp).inDays > 7) {
        expiredIds.add(key.toString());
      }
    }

    if (expiredIds.isNotEmpty) {
      await _box!.deleteAll(expiredIds);
    }
  }

  Future<void> _evictLowPriority() async {
    if (!_isInitialized || _box == null) return;
    String? oldestLowPriorityKey;
    for (var key in _box!.keys) {
      final event = _box!.get(key) as Map;
      if (event['priority'] == TelemetryPriority.low.name || 
          event['priority'] == TelemetryPriority.normal.name) {
        oldestLowPriorityKey = key.toString();
        break;
      }
    }

    if (oldestLowPriorityKey != null) {
      await _box!.delete(oldestLowPriorityKey);
    }
  }

  int get length => _isInitialized ? (_box?.length ?? 0) : 0;
}
