import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/navigation/deep_link_resolver.dart';

void main() {
  group('resolveDeepLinkLocation', () {
    test('maps kovari reset-password URI with token', () {
      expect(
        resolveDeepLinkLocation(
          Uri.parse('kovari://reset-password?token=ABC'),
        ),
        '/reset-password?token=ABC',
      );
    });

    test('rejects reset-password URI without token', () {
      expect(
        resolveDeepLinkLocation(Uri.parse('kovari://reset-password')),
        isNull,
      );
    });

    test('rejects unrelated kovari host', () {
      expect(
        resolveDeepLinkLocation(
          Uri.parse('kovari://some-other-route?token=ABC'),
        ),
        isNull,
      );
    });

    test('maps kovari invite URI to groups invite route', () {
      expect(
        resolveDeepLinkLocation(Uri.parse('kovari://invite/invite-token-1')),
        '/groups/invite/invite-token-1',
      );
    });

    test('maps https invite universal link', () {
      expect(
        resolveDeepLinkLocation(
          Uri.parse('https://kovari.in/invite/universal-token'),
        ),
        '/groups/invite/universal-token',
      );
    });

    test('preserves query parameters on path-based links', () {
      expect(
        resolveDeepLinkLocation(
          Uri.parse('https://kovari.in/reset-password?token=XYZ'),
        ),
        '/reset-password?token=XYZ',
      );
    });
  });

  group('sanitizeDeepLinkForLog', () {
    test('redacts token query parameter', () {
      final sanitized = sanitizeDeepLinkForLog(
        Uri.parse('kovari://reset-password?token=SECRET'),
      );
      expect(sanitized, contains('REDACTED'));
      expect(sanitized, isNot(contains('SECRET')));
    });
  });
}
