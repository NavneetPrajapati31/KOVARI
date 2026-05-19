import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/nav_provider.dart';
import 'package:mobile/core/telemetry/telemetry_service.dart';
import 'package:mobile/core/utils/app_logger.dart';

class KovariNavObserver extends NavigatorObserver {

  KovariNavObserver(this.ref);
  final Ref ref;
  final _telemetry = TelemetryService();
  DateTime? _transitionStart;

  void _updateVisibility(Route<dynamic>? route) {
    if (route == null) return;

    final screenName =
        route.settings.name ??
        route.settings.arguments?.toString() ??
        'unknown_route';

    // SMART DETECTION: Only show NavBar offset for the 5 root shell routes.
    // In go_router, when we are at a root tab, the name/path often matches these.
    // Fallback: If name is null or 'unknown_route', it's likely the AppShell.
    final shellPaths = {
      '/',
      '/explore',
      '/chat',
      '/groups',
      '/profile',
      'app_shell',
    };
    final isShellRoute =
        screenName == 'unknown_route' ||
        screenName == '/' ||
        shellPaths.contains(screenName) ||
        (route.settings.name == null ||
                shellPaths.contains(route.settings.name));

    AppLogger.d('🧭 [NAV] Route: $screenName | isShell: $isShellRoute');

    _telemetry.updateLastRoute(screenName);

    // Log Screen View
    final duration = _transitionStart != null
        ? DateTime.now().difference(_transitionStart!).inMilliseconds
        : 0;

    _telemetry.logEvent(
      'screen_view',
      parameters: {
        'screen_name': screenName,
        'transition_duration_ms': duration,
      },
    );

    // Update visibility smartly
    Future.microtask(() {
      if (ref.read(navBarVisibilityProvider) != isShellRoute) {
        ref.read(navBarVisibilityProvider.notifier).setVisible(isShellRoute);
      }
      ref.read(activeRouteProvider.notifier).setRoute(screenName);
    });
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _transitionStart = DateTime.now();
    super.didPush(route, previousRoute);
    _updateVisibility(route);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _transitionStart = DateTime.now();
    super.didPop(route, previousRoute);
    _updateVisibility(previousRoute);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    _updateVisibility(newRoute);
  }
}
