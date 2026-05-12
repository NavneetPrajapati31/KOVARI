import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/legacy.dart';

enum MutationStatus { pending, sending, success, failure }

class MutationEntry<T> {

  MutationEntry({
    required this.id,
    required this.entityId,
    required this.payload,
    this.status = MutationStatus.pending,
    this.affectedFields,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
  final String id;
  final String entityId;
  final T payload;
  final MutationStatus status;
  final Set<String>? affectedFields;
  final DateTime timestamp;

  MutationEntry<T> copyWith({MutationStatus? status}) => MutationEntry<T>(
      id: id,
      entityId: entityId,
      payload: payload,
      status: status ?? this.status,
      timestamp: timestamp,
    );
}

class MutationJournal extends ChangeNotifier {
  final Map<String, List<MutationEntry<dynamic>>> _journal = {};

  void record(MutationEntry<dynamic> entry) {
    _journal.putIfAbsent(entry.entityId, () => []).add(entry);
    notifyListeners();
  }

  void resolve(String entityId, String mutationId, MutationStatus status) {
    final entries = _journal[entityId];
    if (entries != null) {
      final index = entries.indexWhere((e) => e.id == mutationId);
      if (index != -1) {
        if (status == MutationStatus.success) {
          entries.removeAt(index);
        } else {
          entries[index] = entries[index].copyWith(status: status);
        }
        notifyListeners();
      }
    }
  }

  List<MutationEntry<dynamic>> getPendingFor(String entityId) => _journal[entityId]
            ?.where((e) => e.status == MutationStatus.pending)
            .toList() ??
        [];

  bool hasPending(String entityId) => getPendingFor(entityId).isNotEmpty;
}

final mutationJournalProvider = ChangeNotifierProvider(
  (ref) => MutationJournal(),
);
