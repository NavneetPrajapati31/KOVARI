import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/nav_provider.dart';
import '../config/routes.dart';
import '../providers/auth_provider.dart';
import '../telemetry/telemetry_service.dart';
import '../telemetry/telemetry_priority.dart';

class KovariNavObserver extends NavigatorObserver {
  final WidgetRef ref;
  final _telemetry = TelemetryService();
  DateTime? _transitionStart;

  KovariNavObserver(this.ref);

  void _updateVisibility(Route<dynamic>? route) {
    if (route == null) return;

    // The bottom nav is strictly visible only on core shell routes
    // home, explore, chat, groups, and profile are all sub-tabs of AppShellScreen (/home)
    final isShellRoute =
        route.settings.name == AppRoutes.home || route.settings.name == '/';

    final screenName = route.settings.name ?? 'unknown_route';
    _telemetry.updateLastRoute(screenName);

    // Log Screen View
    final duration = _transitionStart != null 
        ? DateTime.now().difference(_transitionStart!).inMilliseconds 
        : 0;

    _telemetry.logEvent(
      'screen_view',
      priority: TelemetryPriority.normal,
      parameters: {
        'screen_name': screenName,
        'transition_duration_ms': duration,
      },
    );

    // Update visibility immediately to avoid layout jumps
    Future.microtask(() {
      if (ref.read(navBarVisibilityProvider) != isShellRoute) {
        ref.read(navBarVisibilityProvider.notifier).setVisible(isShellRoute);
      }
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
