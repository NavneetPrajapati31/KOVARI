import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/nav_provider.dart';
import '../config/routes.dart';
import '../providers/auth_provider.dart';

class KovariNavObserver extends NavigatorObserver {
  final WidgetRef ref;

  KovariNavObserver(this.ref);

  void _updateVisibility(Route<dynamic>? route) {
    if (route == null) return;
    
    final auth = ref.read(authProvider);
    
    // Check if the current route is the shell (home)
    // We only show the nav bar if we are on the home route AND authenticated
    final isHome = (route.settings.name == AppRoutes.home || 
                    route.settings.name == '/') && 
                   auth.isAuthenticated;
                   
    // We use a small delay to avoid "setState() or markNeedsBuild() called during build"
    Future.microtask(() {
      ref.read(navBarVisibilityProvider.notifier).setVisible(isHome);
    });
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _updateVisibility(route);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    _updateVisibility(previousRoute);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    _updateVisibility(newRoute);
  }
}
