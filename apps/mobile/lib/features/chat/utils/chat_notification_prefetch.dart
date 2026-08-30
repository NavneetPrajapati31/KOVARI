import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/chat/providers/chat_runtime_providers.dart';
import 'package:mobile/features/chat/providers/message_store.dart';
import 'package:mobile/features/chat/utils/direct_chat_id.dart';

/// Resolves the canonical direct-chat id from an FCM/local notification payload.
String? resolveDirectChatIdFromNotification({
  required String entityId,
  String? rawChatId,
  String? myUuid,
}) {
  if (rawChatId != null && rawChatId.isNotEmpty) return rawChatId;
  if (entityId.contains('_')) return entityId;
  if (myUuid != null) return directChatId(myUuid, entityId);
  return null;
}

/// Warms active-conversation state and message hydration before chat navigation.
void prefetchChatForNotificationTap(Ref ref, String chatId) {
  ref.read(activeConversationProvider.notifier).set(chatId);
  unawaited(
    ref.read(messageStoreProvider(chatId).notifier).prefetchFromNotification(),
  );
}
