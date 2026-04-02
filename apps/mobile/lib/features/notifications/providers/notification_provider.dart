import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  // Use ApiClientFactory for consistent configuration
  return NotificationService(ApiClientFactory.create());
});

class NotificationNotifier extends AsyncNotifier<List<NotificationModel>> {
  late final NotificationService _service;

  @override
  FutureOr<List<NotificationModel>> build() async {
    _service = ref.read(notificationServiceProvider);
    return _fetch();
  }

  Future<List<NotificationModel>> _fetch() async {
    return _service.fetchNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetch());
  }

  Future<void> markAsRead(String id) async {
    try {
      await _service.markAsRead(id);
      // Optimistic update
      final currentList = state.value ?? [];
      state = AsyncValue.data(
        currentList.map((n) => n.id == id ? _markReadInModel(n) : n).toList(),
      );
      // Synchronize unread count
      ref.invalidate(unreadCountProvider);
    } catch (e, st) {
      // On error, we might want to refresh to get the true state
      state = AsyncValue.error(e, st);
    }
  }

  NotificationModel _markReadInModel(NotificationModel n) {
    return NotificationModel(
      id: n.id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      isRead: true,
      imageUrl: n.imageUrl,
      type: n.type,
      entityType: n.entityType,
      entityId: n.entityId,
    );
  }

  Future<void> markAllAsRead() async {
    try {
      await _service.markAllAsRead();
      // Optimistic update
      final currentList = state.value ?? [];
      state = AsyncValue.data(
        currentList.map((n) => _markReadInModel(n)).toList(),
      );
      // Synchronize unread count
      ref.invalidate(unreadCountProvider);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final notificationProvider =
    AsyncNotifierProvider<NotificationNotifier, List<NotificationModel>>(
      () => NotificationNotifier(),
    );

class UnreadCountNotifier extends AsyncNotifier<int> {
  Timer? _timer;

  @override
  FutureOr<int> build() {
    // Start polling when provider is initialized
    _startPolling();

    // Clean up timer when provider is disposed
    ref.onDispose(() => _timer?.cancel());

    return _fetch();
  }

  Future<int> _fetch() async {
    final service = ref.read(notificationServiceProvider);
    return service.fetchUnreadCount();
  }

  void _startPolling() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) async {
      // Background fetch: only update state if successful to prevent flickering
      try {
        final count = await _fetch();
        state = AsyncData(count);
      } catch (e) {
        // Silently ignore background polling errors to maintain UX stability
      }
    });
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch());
    // Restart polling interval on manual refresh
    _startPolling();
  }
}

final unreadCountProvider = AsyncNotifierProvider<UnreadCountNotifier, int>(
  UnreadCountNotifier.new,
);
