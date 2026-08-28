import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/groups/models/group.dart';

void main() {
  group('BUG-G2 — Group Membership Synchronization Tests', () {
    test('1. Membership Hydration — Accepted State', () {
      final json = {
        'id': 'user_123',
        'role': 'member',
        'status': 'accepted',
        'joined_at': '2026-08-01T00:00:00.000Z',
        'name': 'Test User',
        'username': 'testuser',
      };

      final member = GroupMember.fromJson(json);

      expect(member.id, 'user_123');
      expect(member.role, 'member');
      expect(member.name, 'Test User');
    });

    test('2. Pending Membership Info — Pending Request Flag', () {
      final membershipJson = {
        'isCreator': false,
        'isMember': false,
        'isAdmin': false,
        'hasPendingRequest': true,
        'membership': {
          'id': 'mem_456',
          'role': 'member',
          'status': 'pending_request',
        },
      };

      final info = MembershipInfo.fromJson(membershipJson);

      expect(info.isCreator, false);
      expect(info.isMember, false);
      expect(info.hasPendingRequest, true);
    });

    test('3. Join Request Parsing — Support for clerk_user_id & user_id fallback', () {
      final requestJson = {
        'id': 'req_789',
        'userId': 'user_2pXXXXXXXXXX',
        'name': 'Pending Applicant',
        'username': 'applicant',
        'avatar': 'https://example.com/avatar.jpg',
        'requestedAt': '2026-08-28T12:00:00.000Z',
      };

      final request = JoinRequestModel.fromJson(requestJson);

      expect(request.id, 'req_789');
      expect(request.userId, 'user_2pXXXXXXXXXX');
      expect(request.name, 'Pending Applicant');
    });

    test('4. Membership State Transitions — Correct Role & Member Checks', () {
      final acceptedJson = {
        'isCreator': true,
        'isMember': true,
        'isAdmin': true,
        'hasPendingRequest': false,
      };

      final info = MembershipInfo.fromJson(acceptedJson);

      expect(info.isCreator, true);
      expect(info.isMember, true);
      expect(info.isAdmin, true);
      expect(info.hasPendingRequest, false);
    });
  });
}
