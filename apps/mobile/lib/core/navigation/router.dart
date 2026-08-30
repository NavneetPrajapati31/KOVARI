import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/navigation/deep_link_resolver.dart';
import 'package:mobile/core/navigation/deep_link_router.dart';
import 'package:mobile/core/navigation/router_notifier.dart';
import 'package:mobile/core/navigation/routes.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/services/fcm_service.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/core/utils/nav_observer.dart';
import 'package:mobile/features/chat/screens/chat_screen.dart';
import 'package:mobile/features/chat/utils/chat_notification_prefetch.dart';
import 'package:mobile/features/chat/utils/direct_chat_id.dart';

/// Backend notification type for incoming group join requests.
const groupJoinRequestReceivedType = 'GROUP_JOIN_REQUEST_RECEIVED';

/// Deep-link sheet token for join-request notification taps.
const joinRequestsSheetDeepLink = 'joinRequests';

/// Settings tab index on [GroupDetailsScreen] (`Overview=0 … Settings=3`).
const groupSettingsTabIndex = 3;

/// Resolves the GoRouter location for a group-scoped notification tap.
String resolveGroupNotificationTapRoute({
  required String entityId,
  required String? notificationType,
}) {
  if (notificationType == groupJoinRequestReceivedType) {
    return '/groups/$entityId?tab=$groupSettingsTabIndex&sheet=$joinRequestsSheetDeepLink';
  }
  return '/groups/$entityId';
}

final routerProvider = Provider<GoRouter>((ref) {
  // Keep a single GoRouter instance; auth/profile changes refresh via
  // [refreshListenable] instead of recreating the router (which drops warm links).
  final notifier = ref.read(routerNotifierProvider);

  final router = GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    debugLogDiagnostics: true,
    redirect: notifier.redirect,
    observers: [KovariNavObserver(ref)],
    restorationScopeId: 'kovari_router',
    routes: [
      ...$appRoutes,
      GoRoute(
        path: '/chat/:chatId',
        name: 'chat_screen',
        pageBuilder: (context, state) {
          final chatId = state.pathParameters['chatId']!;
          return platformPageRoute<void>(
            context: context,
            state: state,
            child: ChatScreen(key: ValueKey(chatId), chatId: chatId),
          );
        },
      ),
    ],
    errorBuilder: (context, state) =>
        Scaffold(body: Center(child: Text('Error: ${state.error}'))),
  );

  // Initialize AppLinks listener
  final appLinks = AppLinks();
  final deepLinkRouter = DeepLinkRouter.fromGoRouter(router);
  DeepLinkBridge.register(deepLinkRouter, appLinks);
  final streamBinder = DeepLinkStreamBinder(deepLinkRouter, appLinks);
  streamBinder.bind();

  // Handle the initial link (when app is launched from a terminated state)
  appLinks.getInitialLink().then((uri) {
    if (uri != null) {
      AppLogger.i('🔗 [DeepLink] Initial Uri: ${sanitizeDeepLinkForLog(uri)}');
      // Allow router/auth bootstrap to settle before cold-start navigation.
      Future<void>.delayed(const Duration(milliseconds: 500), () {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          deepLinkRouter.route(uri);
        });
      });
    }
  });

  // 🔔 [FCM] Notification tap routing
  // entity_type + entity_id are included in every FCM data payload by PushService.
  final fcmSub = FCMService.onNotificationEvent.listen((data) {
    // Foreground events are NOT routed — they are shown as toasts by the shell.
    final isForeground = data['__foreground'] == true;
    if (isForeground) return;

    final entityType = data['entity_type'] as String?;
    final entityId = data['entity_id'] as String?;

    AppLogger.i(
      '🔔 [FCM] Routing tap: entityType=$entityType entityId=$entityId',
    );

    switch (entityType) {
      case 'chat':
        if (entityId != null) {
          final chatType = data['chat_type'] as String?;
          final rawChatId = data['chat_id'] as String?;
          final isDirect = chatType == 'direct' || entityId.contains('_');
          if (isDirect) {
            final resolvedChatId = resolveDirectChatIdFromNotification(
              entityId: entityId,
              rawChatId: rawChatId,
              myUuid: ref.read(authProvider).user?.resolvedUuid,
            );
            if (resolvedChatId != null) {
              prefetchChatForNotificationTap(ref, resolvedChatId);
              router.push('/chat/$resolvedChatId');
            } else {
              prefetchChatForNotificationTap(ref, entityId);
              router.push('/chat/$entityId');
            }
          } else {
            router.push('/groups/$entityId?tab=1');
          }
        }
      case 'group':
        if (entityId != null) {
          final notificationType = data['type'] as String?;
          router.push(
            resolveGroupNotificationTapRoute(
              entityId: entityId,
              notificationType: notificationType,
            ),
          );
        }
      case 'match':
        if (entityId != null) {
          final type = data['type'] as String?;
          if (type == 'MATCH_ACCEPTED') {
            final myUuid = ref.read(authProvider).user?.resolvedUuid;
            if (myUuid != null) {
              final targetChatId = directChatId(myUuid, entityId);
              prefetchChatForNotificationTap(ref, targetChatId);
              router.push('/chat/$targetChatId');
              break;
            }
          }
        }
        router.push('/requests');
      case 'request':
        router.push('/requests');
      case 'notification':
        router.push('/notifications');
      default:
        AppLogger.w(
          '🔔 [FCM] Unknown entityType: $entityType — routing to notifications.',
        );
        router.push('/notifications');
    }
  });

  ref.onDispose(() {
    streamBinder.dispose();
    fcmSub.cancel();
    DeepLinkBridge.unregister();
  });

  return router;
});
