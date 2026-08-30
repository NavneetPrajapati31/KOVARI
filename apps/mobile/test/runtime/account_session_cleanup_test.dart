import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/auth/account_session_cleanup.dart';
import 'package:mobile/core/realtime/realtime_event_pipeline.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/realtime/socket_state.dart';
import 'package:mobile/core/runtime/mutation_journal.dart';
import 'package:mobile/features/chat/models/conversation_entity.dart';
import 'package:mobile/features/chat/models/message_entity.dart';
import 'package:mobile/features/chat/providers/chat_runtime_providers.dart';
import 'package:mobile/features/chat/providers/conversation_runtime_store.dart';
import 'package:mobile/features/chat/providers/message_store.dart';
import 'package:mobile/features/chat/models/pending_upload.dart';
import 'package:mobile/features/chat/providers/pending_upload_store.dart';

class FakeMutationJournal extends ChangeNotifier implements MutationJournal {
  final List<MutationEntry<dynamic>> recorded = [];
  bool clearAllCalled = false;

  @override
  Future<void> record(MutationEntry<dynamic> entry) async {
    recorded.add(entry);
  }

  @override
  void resolve(String entityId, String mutationId, MutationStatus status) {}

  @override
  List<MutationEntry<dynamic>> getPendingFor(String entityId) =>
      recorded.where((e) => e.entityId == entityId).toList();

  @override
  bool hasPending(String entityId) => getPendingFor(entityId).isNotEmpty;

  @override
  Future<void> clearAll() async {
    clearAllCalled = true;
    recorded.clear();
  }
}

class FakePendingUploadStore extends ChangeNotifier implements PendingUploadStore {
  bool clearAllCalled = false;

  @override
  bool get isInitialized => true;

  @override
  List<PendingUpload> get allPending => const [];

  @override
  Future<void> save(PendingUpload upload) async {}

  @override
  Future<void> delete(String id) async {}

  @override
  PendingUpload? get(String id) => null;

  @override
  Future<void> clearAll() async {
    clearAllCalled = true;
  }
}

class FakeSocketService extends SocketService {
  bool disconnectCalled = false;

  @override
  SocketState build() => SocketState.disconnected;

  @override
  void disconnect() {
    disconnectCalled = true;
  }
}

void main() {
  group('BUG-C1a account session cleanup', () {
    late ProviderContainer container;
    late FakeMutationJournal fakeJournal;
    late FakePendingUploadStore fakeUploads;
    late FakeSocketService fakeSocket;

    setUp(() {
      fakeJournal = FakeMutationJournal();
      fakeUploads = FakePendingUploadStore();
      fakeSocket = FakeSocketService();
      container = ProviderContainer(
        overrides: [
          mutationJournalProvider.overrideWith((ref) => fakeJournal),
          pendingUploadStoreProvider.overrideWith((ref) => fakeUploads),
          socketServiceProvider.overrideWith(() => fakeSocket),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('clearAccountScopedChatState empties conversation runtime store', () async {
      final runtime = container.read(conversationRuntimeStoreProvider.notifier);
      runtime.upsert(
        ConversationRuntimeState(
          chatId: 'userA_userB',
          conversationType: ConversationType.direct,
          metadata: ConversationEntity(
            chatId: 'userA_userB',
            participantIds: const ['userA', 'userB'],
            partnerName: 'Account A Partner',
            lastMessageAt: DateTime.now(),
          ),
          lastMessageSnippet: 'Secret from Account A',
          unreadCount: 3,
        ),
      );

      expect(container.read(conversationRuntimeStoreProvider), isNotEmpty);

      await clearAccountScopedChatState(container);

      expect(container.read(conversationRuntimeStoreProvider), isEmpty);
      expect(fakeSocket.disconnectCalled, isTrue);
    });

    test('clearAccountScopedChatState invalidates message stores', () async {
      const chatId = 'userA_userB';
      container.read(messageStoreProvider(chatId).notifier).addOptimistic(
        MessageEntity(
          id: 'pending_1',
          chatId: chatId,
          senderId: 'userA',
          text: 'Leaked message',
          createdAt: DateTime.now(),
          deliveryStatus: MessageDeliveryStatus.pending,
        ),
      );

      expect(
        container.read(messageStoreProvider(chatId)).messages,
        isNotEmpty,
      );

      await clearAccountScopedChatState(container);

      expect(
        container.read(messageStoreProvider(chatId)).messages,
        isEmpty,
      );
    });

    test('clearAccountScopedChatState resets active conversation pointer', () async {
      container.read(activeConversationProvider.notifier).set('userA_userB');

      await clearAccountScopedChatState(container);

      expect(container.read(activeConversationProvider), isNull);
    });

    test('clearAccountScopedChatState clears mutation journal and pending uploads',
        () async {
      await fakeJournal.record(
        MutationEntry<dynamic>(
          id: 'mut-1',
          entityId: 'userA_userB',
          type: MutationType.sendMessage,
          payload: {'text': 'unsent'},
        ),
      );

      await clearAccountScopedChatState(container);

      expect(fakeJournal.clearAllCalled, isTrue);
      expect(fakeJournal.recorded, isEmpty);
      expect(fakeUploads.clearAllCalled, isTrue);
    });

    test('clearAccountScopedChatState clears realtime pipeline queues', () async {
      final pipeline = container.read(realtimeEventPipelineProvider);
      pipeline.clearPendingQueues();

      await clearAccountScopedChatState(container);

      expect(pipeline.metrics.receivedEvents, 0);
    });

    test('ConversationRuntimeStore.clearAccountState removes prior inbox on account switch',
        () {
      final runtime = container.read(conversationRuntimeStoreProvider.notifier);

      runtime.seedFromInbox([
        ConversationEntity(
          chatId: 'accountA_chat_1',
          participantIds: const ['a', 'x'],
          partnerName: 'Account A Chat',
          lastMessageAt: DateTime.now(),
        ),
      ]);

      expect(
        container.read(conversationRuntimeStoreProvider).containsKey(
          'accountA_chat_1',
        ),
        isTrue,
      );

      runtime.clearAccountState();

      expect(container.read(conversationRuntimeStoreProvider), isEmpty);
    });
  });
}
