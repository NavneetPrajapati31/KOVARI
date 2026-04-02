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
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final notificationProvider =
    AsyncNotifierProvider<NotificationNotifier, List<NotificationModel>>(
      () => NotificationNotifier(),
    );

final unreadCountProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(notificationServiceProvider);
  return service.fetchUnreadCount();
});
