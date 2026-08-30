import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Displays a tray notification from a background FCM [RemoteMessage].
///
/// Some Android builds do not surface the system notification automatically when
/// the Flutter process is alive but backgrounded; this is the safety net.
@pragma('vm:entry-point')
Future<void> showBackgroundFcmNotification(RemoteMessage message) async {
  WidgetsFlutterBinding.ensureInitialized();

  final plugin = FlutterLocalNotificationsPlugin();
  const initSettings = InitializationSettings(
    android: AndroidInitializationSettings('@mipmap/ic_launcher'),
  );
  await plugin.initialize(initSettings);

  final androidPlugin = plugin.resolvePlatformSpecificImplementation<
      AndroidFlutterLocalNotificationsPlugin>();
  if (androidPlugin != null) {
    for (final channel in _backgroundChannels) {
      await androidPlugin.createNotificationChannel(channel);
    }
  }

  final data = message.data;
  final entityType = data['entity_type'] as String?;
  final title =
      message.notification?.title ?? data['title'] as String? ?? 'Kovari';
  final body =
      message.notification?.body ??
      data['body'] as String? ??
      'Open Kovari to view update';

  final channelId = _channelIdForEntityType(entityType);

  await plugin.show(
    message.messageId?.hashCode ?? message.hashCode,
    title,
    body,
    NotificationDetails(
      android: AndroidNotificationDetails(
        channelId,
        _channelNameForEntityType(entityType),
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        visibility: NotificationVisibility.public,
      ),
    ),
    payload: jsonEncode(data),
  );
}

const _channelMessages = AndroidNotificationChannel(
  'kovari_messages',
  'Messages',
  description: 'Direct messages and group chat notifications',
  importance: Importance.high,
);

const _channelMatches = AndroidNotificationChannel(
  'kovari_matches',
  'Matches & Requests',
  description: 'Match notifications and connection requests',
  importance: Importance.high,
);

const _channelGroups = AndroidNotificationChannel(
  'kovari_groups',
  'Groups',
  description: 'Group invitations and activity',
  importance: Importance.high,
);

const _backgroundChannels = [
  _channelMessages,
  _channelMatches,
  _channelGroups,
];

String _channelIdForEntityType(String? entityType) {
  switch (entityType) {
    case 'chat':
      return 'kovari_messages';
    case 'group':
      return 'kovari_groups';
    case 'match':
    case 'request':
      return 'kovari_matches';
    default:
      return 'kovari_messages';
  }
}

String _channelNameForEntityType(String? entityType) {
  switch (entityType) {
    case 'chat':
      return 'Messages';
    case 'group':
      return 'Groups';
    case 'match':
    case 'request':
      return 'Matches & Requests';
    default:
      return 'Messages';
  }
}

/// Maps FCM entity types to Android notification channels for tray display.
String backgroundFcmChannelIdForEntityType(String? entityType) =>
    _channelIdForEntityType(entityType);
