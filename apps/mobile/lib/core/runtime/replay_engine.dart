import 'dart:convert';
import 'package:hive/hive.dart';
import 'package:mobile/core/utils/app_logger.dart';

class ReplaySnapshot {

  ReplaySnapshot({required this.metadata, required this.timestamp});

  factory ReplaySnapshot.fromJson(Map<String, dynamic> json) => ReplaySnapshot(
    metadata: json['metadata'] as Map<String, dynamic>,
    timestamp: DateTime.parse(json['timestamp'] as String),
  );
  final Map<String, dynamic> metadata;
  final DateTime timestamp;

  Map<String, dynamic> toJson() => {
    'metadata': metadata,
    'timestamp': timestamp.toIso8601String(),
  };
}

class ReplayEngine {
  static const String _boxName = 'runtime_replay_v1';
  Box<String>? _box;

  Future<void> init() async {
    _box = await Hive.openBox<String>(_boxName);
  }

  void persist(String key, Map<String, dynamic> metadata) {
    final snapshot = ReplaySnapshot(
      metadata: metadata,
      timestamp: DateTime.now(),
    );
    _box?.put(key, jsonEncode(snapshot.toJson()));
  }

  ReplaySnapshot? restore(String key) {
    final raw = _box?.get(key);
    if (raw == null) return null;
    try {
      return ReplaySnapshot.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (e) {
      AppLogger.e('❌ [ReplayEngine] Failed to restore $key: $e');
      return null;
    }
  }

  void clear(String key) {
    _box?.delete(key);
  }
}
