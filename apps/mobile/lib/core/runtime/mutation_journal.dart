import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mobile/core/utils/app_logger.dart';

enum MutationStatus { pending, sending, success, failure }

enum MutationType { sendMessage, updateProfile, createGroup }

class MutationEntry<T> {
  MutationEntry({
    required this.id,
    required this.entityId,
    required this.type,
    required this.payload,
    this.status = MutationStatus.pending,
    this.affectedFields,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  final String id;
  final String entityId;
  final MutationType type;
  final T payload;
  final MutationStatus status;
  final Set<String>? affectedFields;
  final DateTime timestamp;

  MutationEntry<T> copyWith({MutationStatus? status}) => MutationEntry<T>(
    id: id,
    entityId: entityId,
    type: type,
    payload: payload,
    status: status ?? this.status,
    timestamp: timestamp,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'entityId': entityId,
    'type': type.index,
    'payload': payload is Map ? payload : (payload as dynamic).toJson(),
    'status': status.index,
    'timestamp': timestamp.toIso8601String(),
  };
}

class MutationJournal extends ChangeNotifier {
  MutationJournal() {
    _init();
  }

  Box<Map>? _box;
  bool _initialized = false;
  final Map<String, List<MutationEntry<dynamic>>> _journal = {};

  Future<void> _init() async {
    try {
      _box = await Hive.openBox<Map>('mutation_journal_v1');
      for (var key in _box!.keys) {
        final data = _box!.get(key);
        if (data != null) {
          final entityId = data['entityId'] as String;
          final statusIndex = data['status'] as int? ?? 0;
          final typeIndex = data['type'] as int? ?? 0;
          final entry = MutationEntry<dynamic>(
            id: data['id'] as String,
            entityId: entityId,
            type: MutationType.values[typeIndex],
            payload: data['payload'],
            status: MutationStatus.values[statusIndex],
            timestamp: DateTime.parse(data['timestamp'] as String),
          );
          _journal.putIfAbsent(entityId, () => []).add(entry);
        }
      }
      _initialized = true;
      notifyListeners();
    } catch (e) {
      AppLogger.e('🛡️ [MutationJournal] Init failed', error: e);
    }
  }

  Future<void> record(MutationEntry<dynamic> entry) async {
    _journal.putIfAbsent(entry.entityId, () => []).add(entry);
    await _box?.put(entry.id, entry.toJson());
    notifyListeners();
  }

  void resolve(String entityId, String mutationId, MutationStatus status) {
    final entries = _journal[entityId];
    if (entries != null) {
      final index = entries.indexWhere((e) => e.id == mutationId);
      if (index != -1) {
        if (status == MutationStatus.success) {
          entries.removeAt(index);
          _box?.delete(mutationId);
        } else {
          entries[index] = entries[index].copyWith(status: status);
          _box?.put(mutationId, entries[index].toJson());
        }
        notifyListeners();
      }
    }
  }

  List<MutationEntry<dynamic>> getPendingFor(String entityId) {
    if (!_initialized) return [];
    return _journal[entityId]
            ?.where((e) => e.status != MutationStatus.success)
            .toList() ??
        [];
  }

  bool hasPending(String entityId) => getPendingFor(entityId).isNotEmpty;
}

final mutationJournalProvider = ChangeNotifierProvider(
  (ref) => MutationJournal(),
);
