import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/navigation/deep_link_router.dart';

void main() {
  group('DeepLinkRouter', () {
    DeepLinkRouter createRouter({
      String currentLocation = '/login',
      List<String>? pushed,
      List<String>? went,
    }) {
      final pushLog = pushed ?? <String>[];
      final goLog = went ?? <String>[];
      return DeepLinkRouter(
        currentLocation: () => currentLocation,
        navigateGo: goLog.add,
        navigatePush: pushLog.add,
      );
    }

    test('pushes reset-password when current screen is login', () {
      final pushed = <String>[];
      final router = createRouter(pushed: pushed);

      router.route(Uri.parse('kovari://reset-password?token=ABC'));

      expect(pushed, ['/reset-password?token=ABC']);
    });

    test('deduplicates identical URIs within the short window', () {
      final pushed = <String>[];
      final router = createRouter(pushed: pushed);
      final uri = Uri.parse('kovari://reset-password?token=ABC');

      router.route(uri);
      router.route(uri);

      expect(pushed, ['/reset-password?token=ABC']);
    });

    test('force routes the same URI again after dedup window would block', () {
      final pushed = <String>[];
      final router = createRouter(pushed: pushed);
      final uri = Uri.parse('kovari://reset-password?token=ABC');

      router.route(uri);
      router.route(uri, force: true);

      expect(pushed, [
        '/reset-password?token=ABC',
        '/reset-password?token=ABC',
      ]);
    });

    test('ignores invalid reset URI without navigating', () {
      final pushed = <String>[];
      final router = createRouter(pushed: pushed);

      router.route(Uri.parse('kovari://reset-password'));

      expect(pushed, isEmpty);
    });
  });
}
