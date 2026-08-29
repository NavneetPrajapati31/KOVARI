import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/notifications/inbound_notification_event.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/realtime/socket_state.dart';
import 'package:mobile/core/services/fcm_service.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/groups/providers/group_details_provider.dart';
import 'package:mobile/features/notifications/providers/notification_provider.dart';
import 'package:mobile/features/requests/providers/request_provider.dart';

/// Single receiver-side bridge for non-chat realtime notifications.
///
/// Consumes:
/// - Socket `new_notification` (via [SocketService.events])
/// - [FCMService.onNotificationEvent] (foreground receive + tap refresh)
///
/// Chat [NEW_MESSAGE] notifications remain owned by [ConversationRuntimeStore].
class NotificationRealtimeBridge extends Notifier<void> {
  StreamSubscription<SocketEvent>? _socketSub;
  StreamSubscription<Map<String, dynamic>>? _fcmSub;
  final NotificationDedupeGuard _dedupe = NotificationDedupeGuard();

  @override
  void build() {
    ref.keepAlive();

    ref.listen<bool>(
      authProvider.select((s) => s.isAuthenticated),
      (previous, isAuthenticated) {
        if (isAuthenticated) {
          Future.microtask(_attachListeners);
        } else {
          _detachListeners();
          _dedupe.clear();
        }
      },
    );

    ref.listen<SocketState>(socketServiceProvider, (previous, next) {
      if (previous != SocketState.connected &&
          next == SocketState.connected &&
          ref.read(authProvider).isAuthenticated) {
        _refreshNotificationState();
      }
    });

    if (ref.read(authProvider).isAuthenticated) {
      Future.microtask(_attachListeners);
    }

    ref.onDispose(_detachListeners);
  }

  void _attachListeners() {
    if (!ref.read(authProvider).isAuthenticated) return;

    _detachListeners();

    _socketSub = ref.read(socketServiceProvider.notifier).events.listen(
      _onSocketEvent,
    );
    _fcmSub = FCMService.onNotificationEvent.listen(_onFcmEvent);

    AppLogger.i('[NotificationRealtimeBridge] Listeners attached');
  }

  void _detachListeners() {
    _socketSub?.cancel();
    _fcmSub?.cancel();
    _socketSub = null;
    _fcmSub = null;
  }

  void _onSocketEvent(SocketEvent event) {
    if (event.type != 'new_notification') return;
    if (!ref.read(authProvider).isAuthenticated) return;

    final data = event.data;
    if (data is! Map<String, dynamic>) return;

    _processPayload(data, source: 'socket');
  }

  void _onFcmEvent(Map<String, dynamic> data) {
    if (!ref.read(authProvider).isAuthenticated) return;
    _processPayload(data, source: 'fcm');
  }

  void _processPayload(Map<String, dynamic> data, {required String source}) {
    final event = InboundNotificationEvent.tryParse(data);
    if (event == null) return;

    if (event.isChatNotification) {
      AppLogger.d(
        '[NotificationRealtimeBridge] Skipping chat notification ($source): ${event.type}',
      );
      return;
    }

    final dedupeAllows = _dedupe.shouldProcess(event.dedupeKey);
    final dispatch = dispatchInboundNotification(
      event,
      dedupeAllows: dedupeAllows,
    );

    if (dispatch.actions.isEmpty) {
      if (!dedupeAllows) {
        AppLogger.d(
          '[NotificationRealtimeBridge] Deduped notification (${event.dedupeKey})',
        );
      }
      return;
    }

    AppLogger.i(
      '[NotificationRealtimeBridge] Processing ${event.type} via $source',
    );

    for (final action in dispatch.actions) {
      _applyAction(action, event);
    }

    // Scenario 2: FCM is suppressed while the UUID socket room is occupied.
    // Mirror chat's socket-path local notification for visible foreground feedback.
    if (source == 'socket') {
      _maybeShowJoinRequestLocalNotification(event);
    }
  }

  void _maybeShowJoinRequestLocalNotification(InboundNotificationEvent event) {
    final payload = buildJoinRequestLocalNotification(event);
    if (payload == null) return;

    AppLogger.i(
      '[NotificationRealtimeBridge] Showing local notification for group join request',
    );
    FCMService.instance.showLocalNotification(
      title: payload.title,
      body: payload.body,
      data: payload.data,
    );
  }

  void _applyAction(
    NotificationRealtimeAction action,
    InboundNotificationEvent event,
  ) {
    switch (action) {
      case NotificationRealtimeAction.refreshNotifications:
        _refreshNotificationState();
      case NotificationRealtimeAction.invalidateJoinRequests:
        final groupId = event.groupId;
        if (groupId != null) {
          ref.invalidate(joinRequestsProvider(groupId));
          AppLogger.i(
            '[NotificationRealtimeBridge] Invalidated joinRequestsProvider($groupId)',
          );
        }
      case NotificationRealtimeAction.refreshInterests:
        ref.read(interestsProvider.notifier).silentRefresh();
      case NotificationRealtimeAction.refreshInvitations:
        ref.read(invitationsProvider.notifier).silentRefresh();
      case NotificationRealtimeAction.logMissingGroupId:
        AppLogger.w(
          '[NotificationRealtimeBridge] GROUP_JOIN_REQUEST_RECEIVED missing group id',
        );
    }
  }

  void _refreshNotificationState() {
    ref.read(notificationProvider.notifier).refresh(ignoreCache: true);
    ref.invalidate(unreadCountProvider);
  }
}

final notificationRealtimeBridgeProvider =
    NotifierProvider<NotificationRealtimeBridge, void>(
      NotificationRealtimeBridge.new,
    );
