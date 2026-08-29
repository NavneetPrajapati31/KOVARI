import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/navigation/router.dart';
import 'package:mobile/features/groups/screens/group_details_screen.dart';

void main() {
  group('resolveGroupNotificationTapRoute', () {
    test('routes GROUP_JOIN_REQUEST_RECEIVED to Settings + joinRequests sheet', () {
      expect(
        resolveGroupNotificationTapRoute(
          entityId: 'abc',
          notificationType: groupJoinRequestReceivedType,
        ),
        '/groups/abc?tab=3&sheet=joinRequests',
      );
    });

    test('routes GROUP_INVITE_RECEIVED to group overview', () {
      expect(
        resolveGroupNotificationTapRoute(
          entityId: 'abc',
          notificationType: 'GROUP_INVITE_RECEIVED',
        ),
        '/groups/abc',
      );
    });

    test('routes GROUP_JOIN_APPROVED to group overview', () {
      expect(
        resolveGroupNotificationTapRoute(
          entityId: 'abc',
          notificationType: 'GROUP_JOIN_APPROVED',
        ),
        '/groups/abc',
      );
    });

    test('uses entity_id exactly in the route path', () {
      expect(
        resolveGroupNotificationTapRoute(
          entityId: 'group-uuid-99',
          notificationType: groupJoinRequestReceivedType,
        ),
        '/groups/group-uuid-99?tab=3&sheet=joinRequests',
      );
    });

    test('null notification type routes to group overview', () {
      expect(
        resolveGroupNotificationTapRoute(
          entityId: 'abc',
          notificationType: null,
        ),
        '/groups/abc',
      );
    });
  });

  group('shouldAutoPresentJoinRequestsSheet', () {
    test('admin with joinRequests deep link opens sheet', () {
      expect(
        shouldAutoPresentJoinRequestsSheet(
          initialSheet: joinRequestsSheetDeepLinkToken,
          sheetAlreadyOpened: false,
          isAdmin: true,
          isCreator: false,
        ),
        isTrue,
      );
    });

    test('creator with joinRequests deep link opens sheet', () {
      expect(
        shouldAutoPresentJoinRequestsSheet(
          initialSheet: joinRequestsSheetDeepLinkToken,
          sheetAlreadyOpened: false,
          isAdmin: false,
          isCreator: true,
        ),
        isTrue,
      );
    });

    test('demoted user does not open sheet', () {
      expect(
        shouldAutoPresentJoinRequestsSheet(
          initialSheet: joinRequestsSheetDeepLinkToken,
          sheetAlreadyOpened: false,
          isAdmin: false,
          isCreator: false,
        ),
        isFalse,
      );
    });

    test('one-shot guard prevents repeat presentation', () {
      expect(
        shouldAutoPresentJoinRequestsSheet(
          initialSheet: joinRequestsSheetDeepLinkToken,
          sheetAlreadyOpened: true,
          isAdmin: true,
          isCreator: true,
        ),
        isFalse,
      );
    });

    test('other sheet tokens do not open join requests sheet', () {
      expect(
        shouldAutoPresentJoinRequestsSheet(
          initialSheet: 'members',
          sheetAlreadyOpened: false,
          isAdmin: true,
          isCreator: true,
        ),
        isFalse,
      );
    });
  });
}
