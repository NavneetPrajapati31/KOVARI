import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/auth_provider.dart';
import '../models/notification_state.dart';
import '../services/notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return NotificationService(apiClient);
});

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
      ref.watch(authStateProvider);
      return NotificationNotifier(ref);
    });

class NotificationNotifier extends StateNotifier<NotificationState> {
  final Ref _ref;
  NotificationNotifier(this._ref) : super(NotificationState()) {
    _init();
  }

  Future<void> _init() async {
    await refresh(isInitial: true);
  }

  Future<void> refresh({
    bool isInitial = false,
    bool ignoreCache = false,
  }) async {
    if (isInitial || ignoreCache) {
      state = state.copyWith(isLoading: true, page: 1, hasMore: true);
    }

    try {
      final fresh = await _ref
          .read(notificationServiceProvider)
          .fetchNotifications(page: 1, ignoreCache: ignoreCache);
      
      state = state.copyWith(
        notifications: fresh,
        isStale: false,
        isLoading: false,
        error: null,
        page: 1,
        hasMore: fresh.length >= 20, // Assuming 20 is the limit
      );
    } catch (e) {
      if (state.notifications.isEmpty) {
        state = state.copyWith(error: e.toString(), isLoading: false);
      } else {
        state = state.copyWith(isStale: false, isLoading: false);
      }
    }
  }

  Future<void> fetchNextPage() async {
    if (state.isFetchingNextPage || !state.hasMore) return;

    state = state.copyWith(isFetchingNextPage: true);

    try {
      final nextPage = state.page + 1;
      final nextNotifications = await _ref
          .read(notificationServiceProvider)
          .fetchNotifications(page: nextPage);

      if (nextNotifications.isEmpty) {
        state = state.copyWith(hasMore: false, isFetchingNextPage: false);
      } else {
        state = state.copyWith(
          notifications: [...state.notifications, ...nextNotifications],
          page: nextPage,
          hasMore: nextNotifications.length >= 20,
          isFetchingNextPage: false,
        );
      }
    } catch (e) {
      state = state.copyWith(isFetchingNextPage: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    final prevState = state;
    // Optimistic Update
    state = state.copyWith(
      notifications: state.notifications
          .map((n) => n.id == id ? n.copyWith(isRead: true) : n)
          .toList(),
    );

    try {
      await _ref.read(notificationServiceProvider).markAsRead(id);
      _ref.invalidate(unreadCountProvider);
    } catch (e) {
      state = prevState.copyWith(error: 'Failed to mark as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    final prevState = state;
    // Optimistic Update
    state = state.copyWith(
      notifications: state.notifications
          .map((n) => n.copyWith(isRead: true))
          .toList(),
    );

    try {
      await _ref.read(notificationServiceProvider).markAllAsRead();
      _ref.invalidate(unreadCountProvider);
    } catch (e) {
      state = prevState.copyWith(error: 'Failed to mark all as read: $e');
    }
  }
}

class UnreadCountNotifier extends AsyncNotifier<int> {
  Timer? _timer;

  @override
  FutureOr<int> build() {
    // Watch auth state to trigger re-build on login/logout
    ref.watch(authStateProvider);

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
