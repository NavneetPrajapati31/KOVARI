import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/nav_provider.dart';
import '../providers/auth_provider.dart';
import '../telemetry/telemetry_service.dart';
import '../telemetry/telemetry_priority.dart';

class KovariNavObserver extends NavigatorObserver {
  final Ref ref;
  final _telemetry = TelemetryService();
  DateTime? _transitionStart;

  KovariNavObserver(this.ref);

  void _updateVisibility(Route<dynamic>? route) {
    if (route == null) return;

    final screenName = route.settings.name ?? route.settings.arguments?.toString() ?? 'unknown_route';
    
    // In go_router, shell routes usually don't trigger didPush with a specific name that matches legacy AppRoutes.
    // For now, we'll log the event and maintain the visibility logic if a name is present.
    final isShellRoute = screenName == '/' || screenName == 'home' || screenName.isEmpty;
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
