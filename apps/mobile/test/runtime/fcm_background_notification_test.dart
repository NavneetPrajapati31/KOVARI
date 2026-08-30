import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/services/fcm_background_notification.dart';

void main() {
  group('background FCM tray notification routing', () {
    test('chat entity uses messages channel', () {
      expect(backgroundFcmChannelIdForEntityType('chat'), 'kovari_messages');
    });

    test('group entity uses groups channel', () {
      expect(backgroundFcmChannelIdForEntityType('group'), 'kovari_groups');
    });

    test('match and request entities use matches channel', () {
      expect(backgroundFcmChannelIdForEntityType('match'), 'kovari_matches');
      expect(backgroundFcmChannelIdForEntityType('request'), 'kovari_matches');
    });

    test('unknown entity falls back to messages channel', () {
      expect(backgroundFcmChannelIdForEntityType(null), 'kovari_messages');
      expect(backgroundFcmChannelIdForEntityType('other'), 'kovari_messages');
    });
  });

  group('shouldDisplayBackgroundFcmLocally (BUG-N1a Round 2)', () {
    test('skips local display when notification payload is present', () {
      final message = RemoteMessage(
        messageId: 'msg-1',
        notification: const RemoteNotification(
          title: 'New message',
          body: 'Open Kovari to view message',
        ),
        data: const {'entity_type': 'chat', 'type': 'NEW_MESSAGE'},
      );
      expect(shouldDisplayBackgroundFcmLocally(message), isFalse);
    });

    test('shows local display for data-only payloads', () {
      final message = RemoteMessage(
        messageId: 'msg-2',
        data: const {
          'entity_type': 'chat',
          'type': 'NEW_MESSAGE',
          'title': 'New message',
          'body': 'Open Kovari to view message',
        },
      );
      expect(shouldDisplayBackgroundFcmLocally(message), isTrue);
    });
  });
}
