import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/providers/connectivity_provider.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:uuid/uuid.dart';

class QueuedMutation {

  QueuedMutation({
    required this.id,
    required this.path,
    required this.method,
    this.data,
    required this.createdAt,
    this.retryCount = 0,
  });

  factory QueuedMutation.fromJson(Map<String, dynamic> json) => QueuedMutation(
    id: json['id'] as String,
    path: json['path'] as String,
    method: json['method'] as String,
    data: json['data'] != null ? Map<String, dynamic>.from(json['data'] as Map) : null,
    createdAt: DateTime.parse(json['createdAt'] as String),
    retryCount: (json['retryCount'] as int?) ?? 0,
  );
  final String id;
  final String path;
  final String method;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  int retryCount;

  Map<String, dynamic> toJson() => {
    'id': id,
    'path': path,
    'method': method,
    'data': data,
    'createdAt': createdAt.toIso8601String(),
    'retryCount': retryCount,
  };
}

final mutationQueueInitProvider = FutureProvider<Box<String>>((ref) async => Hive.openBox<String>('mutation_queue'));

class MutationQueueNotifier extends Notifier<List<QueuedMutation>> {
  late Box<String> _box;
  bool _isProcessing = false;

  @override
  List<QueuedMutation> build() {
    final boxAsync = ref.watch(mutationQueueInitProvider);

    return boxAsync.when(
      data: (box) {
        _box = box;
        final items = _box.values
            .map((v) => QueuedMutation.fromJson(jsonDecode(v) as Map<String, dynamic>))
            .toList();
        items.sort((a, b) => a.createdAt.compareTo(b.createdAt));

        // Background process on build if online
        unawaited(Future.microtask(() {
          if (ref.read(connectivityProvider).isOnline) {
            processQueue();
          }
        }));

        // Listen for future connectivity changes
        ref.listen(connectivityProvider, (prev, next) {
          if (next.isOnline && !_isProcessing) {
            unawaited(processQueue());
          }
        });

        return items;
      },
      loading: () => [],
      error: (_, _) => [],
    );
  }

  Future<void> enqueue({
    required String path,
    required String method,
    Map<String, dynamic>? data,
  }) async {
    final mutation = QueuedMutation(
      id: const Uuid().v4(),
      path: path,
      method: method,
      data: data,
      createdAt: DateTime.now(),
    );

    await _box.put(mutation.id, jsonEncode(mutation.toJson()));
    state = [...state, mutation];
    AppLogger.i('📥 Mutation enqueued: ${mutation.method} ${mutation.path}');

    if (ref.read(connectivityProvider).isOnline) {
      unawaited(processQueue());
    }
  }

  Future<void> processQueue() async {
    if (_isProcessing || state.isEmpty) return;
    if (ref.read(connectivityProvider).isOffline) return;

    _isProcessing = true;
    AppLogger.i('🚀 Processing mutation queue (${state.length} items)...');

    final apiClient = ref.read(apiClientProvider);

    for (final mutation in List<QueuedMutation>.from(state)) {
      if (ref.read(connectivityProvider).isOffline) break;

      try {
        switch (mutation.method.toUpperCase()) {
          case 'POST':
            await apiClient.post<dynamic>(
              mutation.path,
              data: mutation.data,
              parser: (d) => d,
            );
            break;
          case 'PUT':
            await apiClient.put<dynamic>(
              mutation.path,
              data: mutation.data,
              parser: (d) => d,
            );
            break;
          case 'PATCH':
            await apiClient.patch<dynamic>(
              mutation.path,
              data: mutation.data,
              parser: (d) => d,
            );
            break;
          case 'DELETE':
            await apiClient.delete<dynamic>(
              mutation.path,
              data: mutation.data,
              parser: (d) => d,
            );
            break;
        }

        // Remove from box and state
        await _box.delete(mutation.id);
        state = state.where((m) => m.id != mutation.id).toList();
        AppLogger.i('✅ Queued mutation processed: ${mutation.id}');
      } catch (e) {
        AppLogger.e(
          '❌ Failed to process queued mutation: ${mutation.id}',
          error: e,
        );
        mutation.retryCount++;
        if (mutation.retryCount > 5) {
          // Drop if failed too many times? Or keep?
          AppLogger.w(
            '⚠️ Mutation ${mutation.id} exceeded retry limit. Keeping in queue for manual resolution.',
          );
          break; // Stop processing this for now
        }
        await _box.put(mutation.id, jsonEncode(mutation.toJson()));
        break; // Stop processing to preserve order
      }
    }

    _isProcessing = false;
  }
}

final mutationQueueProvider =
    NotifierProvider<MutationQueueNotifier, List<QueuedMutation>>(MutationQueueNotifier.new);
