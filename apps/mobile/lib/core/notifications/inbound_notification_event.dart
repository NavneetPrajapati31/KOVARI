/// Parsed inbound notification from socket `new_notification` or FCM data payload.
class InboundNotificationEvent {
  const InboundNotificationEvent({
    required this.type,
    this.id,
    this.entityType,
    this.entityId,
    this.chatId,
  });

  final String type;
  final String? id;
  final String? entityType;
  final String? entityId;
  final String? chatId;

  /// Stable dedupe key — prefers backend notification id.
  String get dedupeKey {
    if (id != null && id!.isNotEmpty) return id!;
    return '$type|$entityType|$entityId|$chatId';
  }

  /// Group id for GROUP_JOIN_REQUEST_RECEIVED (entity_type=group, entity_id=groupId).
  String? get groupId {
    if (entityType == 'group' &&
        entityId != null &&
        entityId!.trim().isNotEmpty) {
      return entityId;
    }
    return null;
  }

  /// Chat notifications are handled by [ConversationRuntimeStore].
  bool get isChatNotification {
    if (type == 'NEW_MESSAGE') return true;
    final resolvedChatId = chatId?.trim();
    if (resolvedChatId != null && resolvedChatId.isNotEmpty) {
      return true;
    }
    return false;
  }

  static InboundNotificationEvent? tryParse(Map<String, dynamic> data) {
    final type = _string(data['type']);
    if (type == null || type.isEmpty) return null;

    return InboundNotificationEvent(
      type: type,
      id: _string(data['id']) ?? _string(data['notificationId']),
      entityType: _string(data['entity_type']) ?? _string(data['entityType']),
      entityId: _string(data['entity_id']) ?? _string(data['entityId']),
      chatId: _string(data['chatId']) ?? _string(data['chat_id']),
    );
  }

  static String? _string(dynamic value) {
    if (value == null) return null;
    final s = value.toString().trim();
    return s.isEmpty ? null : s;
  }
}

/// Session-scoped deduplication for notifications observed on multiple channels.
class NotificationDedupeGuard {
  NotificationDedupeGuard({this.maxEntries = 200});

  final int maxEntries;
  final Set<String> _seen = {};

  /// Returns true if this key should be processed (first time seen).
  bool shouldProcess(String key) {
    if (key.isEmpty) return true;
    if (_seen.contains(key)) return false;
    _seen.add(key);
    if (_seen.length > maxEntries) {
      _seen.remove(_seen.first);
    }
    return true;
  }

  void clear() => _seen.clear();
}

/// Pure routing logic — testable without Riverpod.
enum NotificationRealtimeAction {
  refreshNotifications,
  invalidateJoinRequests,
  refreshInterests,
  refreshInvitations,
  logMissingGroupId,
}

class NotificationRealtimeDispatch {
  const NotificationRealtimeDispatch(this.actions);

  final List<NotificationRealtimeAction> actions;
}

NotificationRealtimeDispatch dispatchInboundNotification(
  InboundNotificationEvent event, {
  required bool dedupeAllows,
}) {
  final actions = <NotificationRealtimeAction>[];

  if (event.isChatNotification || !dedupeAllows) {
    return NotificationRealtimeDispatch(actions);
  }

  actions.add(NotificationRealtimeAction.refreshNotifications);

  switch (event.type) {
    case 'GROUP_JOIN_REQUEST_RECEIVED':
      if (event.groupId != null) {
        actions.add(NotificationRealtimeAction.invalidateJoinRequests);
      } else {
        actions.add(NotificationRealtimeAction.logMissingGroupId);
      }
    case 'GROUP_INVITE_RECEIVED':
      actions.add(NotificationRealtimeAction.refreshInvitations);
    case 'MATCH_INTEREST_RECEIVED':
      actions.add(NotificationRealtimeAction.refreshInterests);
    case 'GROUP_JOIN_APPROVED':
    case 'MATCH_ACCEPTED':
      break;
    default:
      break;
  }

  return NotificationRealtimeDispatch(actions);
}
