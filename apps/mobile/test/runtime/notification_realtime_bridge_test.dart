import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/notifications/inbound_notification_event.dart';

void main() {
  group('InboundNotificationEvent', () {
    test('parses GROUP_JOIN_REQUEST_RECEIVED from backend socket payload', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'notif-abc',
        'type': 'GROUP_JOIN_REQUEST_RECEIVED',
        'title': 'Join Request',
        'message': 'Alex wants to join Paris Trip',
        'entity_type': 'group',
        'entity_id': 'group-123',
        'created_at': '2026-08-29T00:00:00.000Z',
      });

      expect(event, isNotNull);
      expect(event!.type, 'GROUP_JOIN_REQUEST_RECEIVED');
      expect(event.groupId, 'group-123');
      expect(event.isChatNotification, isFalse);
      expect(event.dedupeKey, 'notif-abc');
    });

    test('parses FCM payload with notificationId field', () {
      final event = InboundNotificationEvent.tryParse({
        'notificationId': 'fcm-notif-1',
        'type': 'GROUP_JOIN_REQUEST_RECEIVED',
        'entity_type': 'group',
        'entity_id': 'group-456',
      });

      expect(event?.id, 'fcm-notif-1');
      expect(event?.groupId, 'group-456');
    });

    test('NEW_MESSAGE with chatId is classified as chat notification', () {
      final event = InboundNotificationEvent.tryParse({
        'type': 'NEW_MESSAGE',
        'chatId': 'chat-room-1',
        'message': 'Hello',
      });

      expect(event?.isChatNotification, isTrue);
    });

    test('returns null for empty type', () {
      expect(InboundNotificationEvent.tryParse({'title': 'x'}), isNull);
    });

    test('GROUP_JOIN_REQUEST without group id has null groupId', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'n1',
        'type': 'GROUP_JOIN_REQUEST_RECEIVED',
        'entity_type': 'match',
        'entity_id': 'user-1',
      });

      expect(event?.groupId, isNull);
    });
  });

  group('NotificationDedupeGuard', () {
    test('blocks duplicate notification id', () {
      final guard = NotificationDedupeGuard();
      expect(guard.shouldProcess('notif-1'), isTrue);
      expect(guard.shouldProcess('notif-1'), isFalse);
    });

    test('clear resets session dedupe state', () {
      final guard = NotificationDedupeGuard();
      guard.shouldProcess('notif-1');
      guard.clear();
      expect(guard.shouldProcess('notif-1'), isTrue);
    });
  });

  group('dispatchInboundNotification', () {
    test('GROUP_JOIN_REQUEST_RECEIVED invalidates join requests', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'n1',
        'type': 'GROUP_JOIN_REQUEST_RECEIVED',
        'entity_type': 'group',
        'entity_id': 'group-99',
      })!;

      final dispatch = dispatchInboundNotification(event, dedupeAllows: true);

      expect(
        dispatch.actions,
        contains(NotificationRealtimeAction.refreshNotifications),
      );
      expect(
        dispatch.actions,
        contains(NotificationRealtimeAction.invalidateJoinRequests),
      );
    });

    test('chat notification produces no bridge actions', () {
      final event = InboundNotificationEvent.tryParse({
        'type': 'NEW_MESSAGE',
        'chatId': 'chat-1',
        'id': 'msg-notif',
      })!;

      final dispatch = dispatchInboundNotification(event, dedupeAllows: true);

      expect(dispatch.actions, isEmpty);
    });

    test('unknown type refreshes notifications only', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'n2',
        'type': 'REPORT_SUBMITTED',
        'entity_type': 'report',
        'entity_id': 'r1',
      })!;

      final dispatch = dispatchInboundNotification(event, dedupeAllows: true);

      expect(dispatch.actions, [NotificationRealtimeAction.refreshNotifications]);
    });

    test('missing group id logs diagnostic action not invalidate', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'n3',
        'type': 'GROUP_JOIN_REQUEST_RECEIVED',
        'entity_type': 'group',
      })!;

      final dispatch = dispatchInboundNotification(event, dedupeAllows: true);

      expect(
        dispatch.actions,
        contains(NotificationRealtimeAction.logMissingGroupId),
      );
      expect(
        dispatch.actions,
        isNot(contains(NotificationRealtimeAction.invalidateJoinRequests)),
      );
    });

    test('duplicate dedupe key produces no actions', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'dup-1',
        'type': 'GROUP_JOIN_REQUEST_RECEIVED',
        'entity_type': 'group',
        'entity_id': 'group-1',
      })!;

      final dispatch = dispatchInboundNotification(event, dedupeAllows: false);

      expect(dispatch.actions, isEmpty);
    });

    test('MATCH_INTEREST_RECEIVED refreshes interests', () {
      final event = InboundNotificationEvent.tryParse({
        'id': 'mi-1',
        'type': 'MATCH_INTEREST_RECEIVED',
        'entity_type': 'match',
        'entity_id': 'user-a',
      })!;

      final dispatch = dispatchInboundNotification(event, dedupeAllows: true);

      expect(
        dispatch.actions,
        contains(NotificationRealtimeAction.refreshInterests),
      );
    });
  });
}
