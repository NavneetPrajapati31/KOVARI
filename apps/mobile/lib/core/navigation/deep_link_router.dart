import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/navigation/deep_link_resolver.dart';
import 'package:mobile/core/utils/app_logger.dart';

/// Time window for suppressing duplicate platform events (stream + initial link).
const deepLinkDedupWindow = Duration(seconds: 2);

/// Routes where a warm deep link should stack reset-password above login.
const warmPushAuthRoutes = {'/', '/login', '/forgot-password', '/sign-up'};

typedef DeepLinkNavigate = void Function(String location);

/// Routes incoming platform URIs to GoRouter locations with short-window dedup.
class DeepLinkRouter {
  DeepLinkRouter({
    required String Function() currentLocation,
    required DeepLinkNavigate navigateGo,
    required DeepLinkNavigate navigatePush,
  })  : _currentLocation = currentLocation,
        _navigateGo = navigateGo,
        _navigatePush = navigatePush;

  factory DeepLinkRouter.fromGoRouter(GoRouter router) => DeepLinkRouter(
        currentLocation: () => router.state.matchedLocation,
        navigateGo: router.go,
        navigatePush: router.push,
      );

  final String Function() _currentLocation;
  final DeepLinkNavigate _navigateGo;
  final DeepLinkNavigate _navigatePush;

  String? _lastRoutedUri;
  DateTime? _lastRoutedAt;

  void clearDedup() {
    _lastRoutedUri = null;
    _lastRoutedAt = null;
  }

  void route(Uri uri, {bool force = false}) {
    final uriKey = uri.toString();
    if (!force && _isDuplicate(uriKey)) {
      AppLogger.d(
        '🔗 [DeepLink] Skipping duplicate Uri: ${sanitizeDeepLinkForLog(uri)}',
      );
      return;
    }

    final location = resolveDeepLinkLocation(uri);
    if (location == null) {
      AppLogger.w(
        '🔗 [DeepLink] Unsupported or incomplete link: ${sanitizeDeepLinkForLog(uri)}',
      );
      return;
    }

    _lastRoutedUri = uriKey;
    _lastRoutedAt = DateTime.now();
    AppLogger.i('🔗 [DeepLink] Routing to: $location');

    if (warmPushAuthRoutes.contains(_currentLocation())) {
      _navigatePush(location);
    } else {
      _navigateGo(location);
    }
  }

  Future<void> pollLatestLink(AppLinks appLinks, {bool force = false}) async {
    final uri = await appLinks.getLatestLink();
    if (uri == null) return;
    AppLogger.i(
      '🔗 [DeepLink] Latest Uri on resume: ${sanitizeDeepLinkForLog(uri)}',
    );
    route(uri, force: force);
  }

  bool _isDuplicate(String uriKey) {
    if (_lastRoutedUri != uriKey || _lastRoutedAt == null) return false;
    return DateTime.now().difference(_lastRoutedAt!) < deepLinkDedupWindow;
  }
}

/// Bridges app lifecycle to the active [DeepLinkRouter] instance.
class DeepLinkBridge {
  static DeepLinkRouter? _router;
  static AppLinks? _appLinks;

  static void register(DeepLinkRouter router, AppLinks appLinks) {
    _router = router;
    _appLinks = appLinks;
  }

  static void unregister() {
    _router = null;
    _appLinks = null;
  }

  /// Called when the app returns to foreground (after auth/bootstrap settles).
  static Future<void> onAppResumed() async {
    final router = _router;
    final appLinks = _appLinks;
    if (router == null || appLinks == null) return;

    router.clearDedup();
    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      router.pollLatestLink(appLinks, force: true);
    });
  }

  static void onAppPaused() {
    _router?.clearDedup();
  }
}

/// Forwards platform link stream events after the frame is ready.
class DeepLinkStreamBinder {
  DeepLinkStreamBinder(this._router, this._appLinks);

  final DeepLinkRouter _router;
  final AppLinks _appLinks;
  StreamSubscription<Uri>? _subscription;

  void bind() {
    _subscription = _appLinks.uriLinkStream.listen((uri) {
      AppLogger.i(
        '🔗 [DeepLink] Incoming Uri: ${sanitizeDeepLinkForLog(uri)}',
      );
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _router.route(uri);
      });
    });
  }

  void dispose() {
    _subscription?.cancel();
  }
}
