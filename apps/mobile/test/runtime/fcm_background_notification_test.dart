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
}
