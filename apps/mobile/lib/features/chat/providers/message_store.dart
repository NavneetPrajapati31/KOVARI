import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/security/encryption_service.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/chat/models/message_entity.dart';
import 'package:mobile/features/chat/providers/conversation_store.dart';
import 'package:mobile/features/chat/utils/direct_chat_id.dart';

/// Max messages to keep HOT in memory per conversation.
const _kHotWindowSize = 75;

/// State held by the MessageStore for a single conversation.
class ConversationMessageState {
  const ConversationMessageState({
    required this.chatId,
    this.messages = const {},
    this.orderedIds = const [],
    this.highestKnownSequence = 0,
    this.isHydrating = false,
    this.hasReachedTop = false,
    this.nextCursor,
    this.pendingGap,
  });

  final String chatId;

  /// Normalized entity map: messageId → MessageEntity
  final Map<String, MessageEntity> messages;

  /// Ordered list of IDs, sorted by conversationSequence (authoritative).
  final List<String> orderedIds;

  /// The highest CSN we have seen. Used for gap detection.
  final int highestKnownSequence;

  final bool isHydrating;
  final bool hasReachedTop;
  final String? nextCursor;

  /// A detected gap (fromSeq, toSeq) awaiting recovery.
  final (int, int)? pendingGap;

  /// Ordered, renderable messages — sliding HOT window (tail of the list).
  List<MessageEntity> get hotMessages {
    final all = orderedIds
        .map((id) => messages[id])
        .whereType<MessageEntity>()
        .toList();
    if (all.length > _kHotWindowSize) {
      return all.sublist(all.length - _kHotWindowSize);
    }
    return all;
  }

  ConversationMessageState copyWith({
    Map<String, MessageEntity>? messages,
    List<String>? orderedIds,
    int? highestKnownSequence,
    bool? isHydrating,
    bool? hasReachedTop,
    String? nextCursor,
    (int, int)? pendingGap,
    bool clearGap = false,
  }) => ConversationMessageState(
    chatId: chatId,
    messages: messages ?? this.messages,
    orderedIds: orderedIds ?? this.orderedIds,
    highestKnownSequence: highestKnownSequence ?? this.highestKnownSequence,
    isHydrating: isHydrating ?? this.isHydrating,
    hasReachedTop: hasReachedTop ?? this.hasReachedTop,
    nextCursor: nextCursor ?? this.nextCursor,
    pendingGap: clearGap ? null : (pendingGap ?? this.pendingGap),
  );
}

/// Normalized message store for a single conversation, keyed by [chatId].
///
/// Ordering: always by [conversationSequence] (authoritative). Falls back to
/// [createdAt] for optimistic (pending) messages without a CSN.
///
/// Sliding window: only [_kHotWindowSize] most recent messages are HOT.
/// Gap detection: emits `request_gap_fill` automatically via SocketService.
class MessageStore extends Notifier<ConversationMessageState> {
  late String _chatId;

  void init(String chatId) => _chatId = chatId;
  @override
  ConversationMessageState build() {
    // 💎 Instagram-Pro: Keep messages HOT in memory even after leaving the screen
    final link = ref.keepAlive();

    // Auto-dispose after 5 minutes of inactivity to save memory
    Timer? disposeTimer;
    ref.onDispose(() => disposeTimer?.cancel());
    ref.onCancel(() {
      disposeTimer = Timer(const Duration(minutes: 5), () => link.close());
    });
    ref.onResume(() => disposeTimer?.cancel());

    final events = ref.watch(socketServiceProvider.notifier).events;
    final sub = events.listen((SocketEvent event) => _handleSocketEvent(event));
    ref.onDispose(() => sub.cancel());

    // Eagerly hydrate from API in the next microtask to ensure state is initialized
    Future.microtask(() => _hydrate());

    return ConversationMessageState(chatId: _chatId);
  }

  Future<void> _hydrate() async {
    print('🧪 [MessageStore] HYDRATE START for $_chatId');

    // Only show loading state if we have ZERO messages in memory
    final isFirstLoad = state.messages.isEmpty;
    if (isFirstLoad) {
      state = state.copyWith(isHydrating: true);
    }

    try {
      final authUser = ref.read(authProvider).user;
      if (authUser == null) {
        print('❌ [MessageStore] FAILED: authUser is NULL');
        return;
      }

      print(
        '🧪 [MessageStore] My ClerkID: ${authUser.id} | My UUID: ${authUser.uuid}',
      );

      // Resolve partnerId from chatId
      final partnerId = directChatPartnerId(
        _chatId,
        authUser.id,
        myUserUuid: authUser.uuid,
      );
      if (partnerId == null) {
        print('❌ [MessageStore] FAILED: partnerId is NULL for $_chatId');
        state = state.copyWith(isHydrating: false);
        return;
      }
      print('🧪 [MessageStore] Resolved Partner: $partnerId');
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.get<Map<String, dynamic>>(
        'direct-chat/messages',
        queryParameters: {'partnerId': partnerId},
        parser: (data) => data as Map<String, dynamic>,
        ignoreCache: true, // Always get fresh history when opening chat
      );

      final rawMessages = response.data?['messages'] as List<dynamic>? ?? [];
      print(
        '🧪 [MessageStore] API Success. Raw messages: ${rawMessages.length}',
      );
      final List<MessageEntity> entities = [];

      for (final json in rawMessages) {
        try {
          final entity = MessageEntity.fromSocket(
            json as Map<String, dynamic>,
            _chatId,
          );
          // Decrypt if necessary
          final decrypted = await _decryptIfNeeded(entity);
          entities.add(decrypted ?? entity);
        } catch (e) {
          AppLogger.e('[MessageStore] Error parsing message', error: e);
        }
      }

      // Bulk insert into state
      hydrateFromHistory(
        entities,
        hasReachedTop: entities.length < _kHotWindowSize,
      );
    } catch (e, stack) {
      AppLogger.e(
        '[MessageStore] Hydration failed',
        error: e,
        stackTrace: stack,
      );
    } finally {
      state = state.copyWith(isHydrating: false);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  void setHydrating({required bool value}) =>
      state = state.copyWith(isHydrating: value);

  /// Bulk-insert messages from a history API response page.
  void hydrateFromHistory(
    List<MessageEntity> messages, {
    String? nextCursor,
    bool hasReachedTop = false,
  }) {
    if (messages.isEmpty) {
      state = state.copyWith(isHydrating: false, hasReachedTop: hasReachedTop);
      return;
    }

    final updated = Map<String, MessageEntity>.from(state.messages);

    for (final msg in messages) {
      // 1. Precise ID deduplication (Map key)
      // 2. Client ID deduplication (reconcile pending)
      String? existingKey;
      if (msg.clientMessageId != null) {
        existingKey = updated.keys.firstWhere(
          (k) => updated[k]?.clientMessageId == msg.clientMessageId,
          orElse: () => '',
        );
      }

      // 3. Content Fingerprint (Robust fallback for modern social feel)
      if (existingKey == null || existingKey.isEmpty) {
        existingKey = updated.keys.firstWhere((k) {
          final e = updated[k]!;
          return e.senderId == msg.senderId &&
              e.text == msg.text &&
              (e.createdAt.difference(msg.createdAt).inSeconds.abs() < 2);
        }, orElse: () => '');
      }

      if (existingKey.isNotEmpty) {
        // Merge: Keep existing ID if it's authoritative, but update data
        updated[existingKey] = updated[existingKey]!.copyWith(
          id: msg.id, // Ensure we have the latest server ID
          conversationSequence: msg.conversationSequence,
          deliveryStatus: msg.deliveryStatus,
          serverSequence: msg.serverSequence,
        );
      } else {
        updated[msg.id] = msg;
      }
    }

    final ordered = _buildOrderedIds(updated);
    final highestSeq = _computeHighestSeq(updated);

    state = state.copyWith(
      messages: updated,
      orderedIds: ordered,
      highestKnownSequence: highestSeq > state.highestKnownSequence
          ? highestSeq
          : state.highestKnownSequence,
      isHydrating: false,
      hasReachedTop: hasReachedTop,
      nextCursor: nextCursor,
    );

    AppLogger.d(
      '[MessageStore:$_chatId] Hydrated ${messages.length} msgs. Deduplicated to ${updated.length} total.',
    );
  }

  /// Insert an optimistic message for immediate UI display.
  void addOptimistic(MessageEntity optimistic) {
    final updated = Map<String, MessageEntity>.from(state.messages)
      ..[optimistic.id] = optimistic;
    state = state.copyWith(
      messages: updated,
      orderedIds: _buildOrderedIds(updated),
    );
  }

  /// Reconcile optimistic → authoritative. Prevents duplicate renders.
  /// [clientMessageId] → [serverMessageId] mapping.
  void reconcileOptimistic({
    required String clientMessageId,
    required String serverMessageId,
    required int conversationSequence,
    required int serverSequence,
  }) {
    final pendingId = 'pending_$clientMessageId';
    final optimistic = state.messages[pendingId];
    if (optimistic == null) {
      AppLogger.w(
        '[MessageStore] reconcileOptimistic: no pending msg for $clientMessageId',
      );
      return;
    }

    final authoritative = optimistic.copyWith(
      id: serverMessageId,
      clientMessageId: clientMessageId,
      conversationSequence: conversationSequence,
      serverSequence: serverSequence,
      deliveryStatus: MessageDeliveryStatus.sent,
    );

    final updated = Map<String, MessageEntity>.from(state.messages)
      ..remove(pendingId)
      ..[serverMessageId] = authoritative;

    _detectAndHandleGap(conversationSequence, updated);

    state = state.copyWith(
      messages: updated,
      orderedIds: _buildOrderedIds(updated),
      highestKnownSequence: conversationSequence > state.highestKnownSequence
          ? conversationSequence
          : state.highestKnownSequence,
    );

    AppLogger.d(
      '[MessageStore] Reconciled $clientMessageId → $serverMessageId (CSN: $conversationSequence)',
    );
  }

  /// Update the delivery status of a single message.
  void updateDeliveryStatus(String messageId, MessageDeliveryStatus status) {
    final msg = state.messages[messageId];
    if (msg == null) return;
    final updated = Map<String, MessageEntity>.from(state.messages)
      ..[messageId] = msg.copyWith(deliveryStatus: status);
    state = state.copyWith(messages: updated);
  }

  /// Mark all messages with CSN ≤ [lastSeenSequence] as seen.
  void markSeenUpTo(int lastSeenSequence) {
    final updated = Map<String, MessageEntity>.from(state.messages);
    var changed = false;
    for (final entry in updated.entries) {
      final msg = entry.value;
      final csn = msg.conversationSequence;
      if (csn != null &&
          csn <= lastSeenSequence &&
          msg.deliveryStatus != MessageDeliveryStatus.seen) {
        updated[entry.key] = msg.copyWith(
          deliveryStatus: MessageDeliveryStatus.seen,
        );
        changed = true;
      }
    }
    if (changed) state = state.copyWith(messages: updated);
  }

  /// Apply gap-fill messages from the server.
  void applyGapFill(List<MessageEntity> gapMessages) {
    if (gapMessages.isEmpty) return;
    final updated = Map<String, MessageEntity>.from(state.messages);
    for (final msg in gapMessages) {
      updated[msg.id] = msg;
    }
    final highestSeq = _computeHighestSeq(updated);
    state = state.copyWith(
      messages: updated,
      orderedIds: _buildOrderedIds(updated),
      highestKnownSequence: highestSeq,
      clearGap: true,
    );
    AppLogger.i(
      '[MessageStore] Gap filled with ${gapMessages.length} messages',
    );
  }

  // ---------------------------------------------------------------------------
  // Socket Event Handling
  // ---------------------------------------------------------------------------

  void _handleSocketEvent(SocketEvent event) {
    final data = event.data as Map<String, dynamic>?;
    if (data == null) return;
    final msgChatId = data['chatId'] as String?;
    if (msgChatId != _chatId) return;

    switch (event.type) {
      case 'receive_message':
        _onReceiveMessage(data);
      case 'message_persisted':
        _onMessagePersisted(data);
      case 'messages_seen':
        final lastSeenSeq = data['lastSeenSequence'] as int?;
        if (lastSeenSeq != null) markSeenUpTo(lastSeenSeq);
      case 'message_delivered_ack':
        final messageId = data['messageId'] as String?;
        if (messageId != null) {
          updateDeliveryStatus(messageId, MessageDeliveryStatus.delivered);
        }
      default:
        break;
    }
  }

  void _onReceiveMessage(Map<String, dynamic> data) async {
    try {
      final entity = MessageEntity.fromSocket(data, _chatId);

      // 1. Content-based deduplication for real-time race conditions
      final isDuplicate = state.messages.values.any(
        (e) =>
            (e.id == entity.id) ||
            (entity.clientMessageId != null &&
                e.clientMessageId == entity.clientMessageId) ||
            (e.senderId == entity.senderId &&
                e.text == entity.text &&
                e.createdAt.difference(entity.createdAt).inSeconds.abs() < 2),
      );

      if (isDuplicate) {
        print(
          '🛡️ [MessageStore] Dropping duplicate real-time message: ${entity.id}',
        );
        return;
      }

      // Decrypt if necessary
      final decrypted = await _decryptIfNeeded(entity);
      final finalEntity = decrypted ?? entity;

      final csn = finalEntity.conversationSequence;
      final updated = Map<String, MessageEntity>.from(state.messages)
        ..[finalEntity.id] = finalEntity;

      if (csn != null) _detectAndHandleGap(csn, updated);

      final highestSeq = csn != null && csn > state.highestKnownSequence
          ? csn
          : state.highestKnownSequence;

      state = state.copyWith(
        messages: updated,
        orderedIds: _buildOrderedIds(updated),
        highestKnownSequence: highestSeq,
      );

      ref.read(conversationStoreProvider.notifier)
        ..updateLastMessage(_chatId, finalEntity)
        ..incrementUnread(_chatId);
    } catch (e, stack) {
      AppLogger.e(
        '[MessageStore] Error in _onReceiveMessage',
        error: e,
        stackTrace: stack,
      );
    }
  }

  Future<MessageEntity?> _decryptIfNeeded(MessageEntity entity) async {
    final myUserId = ref.read(authProvider).user?.id;
    if (myUserId == null) return null;

    if (entity.isEncrypted &&
        entity.encryptedContent != null &&
        entity.encryptionIv != null &&
        entity.encryptionSalt != null) {
      final user = ref.read(authProvider).user;
      final partnerId = directChatPartnerId(
        _chatId,
        myUserId,
        myUserUuid: user?.uuid,
      );
      if (partnerId == null) return null;

      final conversation = ref.read(conversationProvider(_chatId));

      // Prioritize IDs from the message itself (real-time sync)
      // then from the conversation store, then finally fall back to UUIDs
      final myClerkId = (entity.senderId == myUserId)
          ? entity.senderClerkId
          : entity.receiverClerkId;
      final partnerClerkIdFromMsg = (entity.senderId == myUserId)
          ? entity.receiverClerkId
          : entity.senderClerkId;

      final myEffectiveId = myClerkId ?? myUserId;
      final partnerClerkId =
          partnerClerkIdFromMsg ?? conversation?.partnerClerkId ?? partnerId;

      final sharedSecret = myEffectiveId.compareTo(partnerClerkId) < 0
          ? '$myEffectiveId:$partnerClerkId'
          : '$partnerClerkId:$myEffectiveId';

      try {
        final decryptedText = await EncryptionService().decryptMessage(
          encryptedContent: entity.encryptedContent!,
          iv: entity.encryptionIv!,
          salt: entity.encryptionSalt!,
          key: sharedSecret,
        );
        return entity.copyWith(text: decryptedText);
      } catch (e) {
        AppLogger.e(
          '[MessageStore] Decryption failed for ${entity.id}',
          error: e,
        );
      }
    }
    return null;
  }

  void _onMessagePersisted(Map<String, dynamic> data) {
    final tempId = data['tempId'] as String?;
    final serverMessageId = data['messageId'] as String?;
    final csn = data['conversationSequence'] as int?;
    final ssn = data['serverSequence'] as int?;

    if (tempId != null &&
        serverMessageId != null &&
        csn != null &&
        ssn != null) {
      reconcileOptimistic(
        clientMessageId: tempId,
        serverMessageId: serverMessageId,
        conversationSequence: csn,
        serverSequence: ssn,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Gap Detection
  // ---------------------------------------------------------------------------

  void _detectAndHandleGap(
    int incomingCsn,
    Map<String, MessageEntity> currentMessages,
  ) {
    final highest = _computeHighestSeq(currentMessages);
    if (highest == 0 || incomingCsn == 0) return;
    if (incomingCsn > highest + 1) {
      final fromSeq = highest + 1;
      final toSeq = incomingCsn - 1;
      AppLogger.w(
        '[MessageStore:$_chatId] 🚨 Gap detected! Missing CSN $fromSeq–$toSeq',
      );
      state = state.copyWith(pendingGap: (fromSeq, toSeq));
      ref.read(socketServiceProvider.notifier).emit(
        'request_gap_fill',
        <String, dynamic>{
          'chatId': _chatId,
          'fromSequence': fromSeq,
          'toSequence': toSeq,
        },
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  List<String> _buildOrderedIds(Map<String, MessageEntity> messages) {
    final sorted = messages.values.toList()
      ..sort((a, b) {
        final aSeq = a.conversationSequence;
        final bSeq = b.conversationSequence;
        if (aSeq != null && bSeq != null) return aSeq.compareTo(bSeq);
        if (aSeq != null) return -1;
        if (bSeq != null) return 1;
        return a.createdAt.compareTo(b.createdAt);
      });
    return sorted.map((m) => m.id).toList();
  }

  int _computeHighestSeq(Map<String, MessageEntity> messages) {
    var highest = 0;
    for (final msg in messages.values) {
      final csn = msg.conversationSequence;
      if (csn != null && csn > highest) highest = csn;
    }
    return highest;
  }
}

/// Factory that creates a per-conversation [MessageStore] keyed by [chatId].
///
/// Usage: `ref.watch(messageStoreProvider('chatId_here'))`
final messageStoreProvider =
    NotifierProvider.family<MessageStore, ConversationMessageState, String>(
      (chatId) => MessageStore()..init(chatId),
    );
