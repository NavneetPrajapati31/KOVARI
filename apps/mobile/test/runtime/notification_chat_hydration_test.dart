import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/chat/cache/conversation_cache_models.dart';
import 'package:mobile/features/chat/cache/conversation_cache_repository.dart';
import 'package:mobile/features/chat/cache/conversation_repository.dart';
import 'package:mobile/features/chat/cache/conversation_sync_engine.dart';
import 'package:mobile/features/chat/utils/chat_notification_prefetch.dart';
import 'package:mocktail/mocktail.dart';

class MockConversationCacheRepository extends Mock
    implements ConversationCacheRepository {}

class MockConversationRepository extends Mock
    implements ConversationRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(<String, dynamic>{});
    registerFallbackValue(
      ConversationMetadata(
        conversationId: '',
        lastSequence: 0,
        lastReadSequence: 0,
        lastSyncedAt: DateTime.utc(2026, 1, 1),
        cacheSchemaVersion: 2,
        cachedMessageCount: 0,
      ),
    );
    registerFallbackValue(
      ConversationIndex(
        conversationId: '',
        lastMessageSnippet: '',
        lastMessageId: '',
        lastSequence: 0,
        updatedAt: DateTime.utc(2026, 1, 1),
        lastSyncAt: DateTime.utc(2026, 1, 1),
        unreadCount: 0,
        participantIds: const [],
        cacheSchemaVersion: 2,
      ),
    );
    registerFallbackValue(<CachedMessage>[]);
  });

  group('resolveDirectChatIdFromNotification', () {
    test('prefers explicit chat_id from payload', () {
      expect(
        resolveDirectChatIdFromNotification(
          entityId: 'partner-uuid',
          rawChatId: 'uuid-a_uuid-b',
          myUuid: 'uuid-a',
        ),
        'uuid-a_uuid-b',
      );
    });

    test('uses entity_id when it is already a direct room id', () {
      expect(
        resolveDirectChatIdFromNotification(
          entityId: 'uuid-a_uuid-b',
          myUuid: 'uuid-a',
        ),
        'uuid-a_uuid-b',
      );
    });

    test('builds deterministic room id from partner uuid + my uuid', () {
      expect(
        resolveDirectChatIdFromNotification(
          entityId: 'uuid-b',
          myUuid: 'uuid-a',
        ),
        'uuid-a_uuid-b',
      );
    });

    test('returns null when partner uuid cannot be resolved yet', () {
      expect(
        resolveDirectChatIdFromNotification(entityId: 'uuid-b'),
        isNull,
      );
    });
  });

  group('ConversationSyncEngine.syncDelta', () {
    late MockConversationCacheRepository cacheRepo;
    late MockConversationRepository remoteRepo;
    late ConversationSyncEngine engine;

    setUp(() {
      cacheRepo = MockConversationCacheRepository();
      remoteRepo = MockConversationRepository();
      engine = ConversationSyncEngine(
        cacheRepository: cacheRepo,
        remoteRepository: remoteRepo,
      );
    });

    test('retries with full sync when metadata is ahead of empty cache', () async {
      const chatId = 'uuid-a_uuid-b';
      final meta = ConversationMetadata(
        conversationId: chatId,
        lastSequence: 12,
        lastReadSequence: 0,
        lastSyncedAt: DateTime.utc(2026, 1, 1),
        cacheSchemaVersion: 2,
        cachedMessageCount: 0,
      );

      when(() => cacheRepo.getMetadata(chatId)).thenReturn(meta);
      when(() => cacheRepo.getMessages(chatId)).thenReturn([]);

      var callCount = 0;
      when(
        () => remoteRepo.fetchMessages(
          path: any(named: 'path'),
          queryParameters: any(named: 'queryParameters'),
        ),
      ).thenAnswer((invocation) async {
        callCount += 1;
        final params =
            invocation.namedArguments[#queryParameters] as Map<String, dynamic>;
        if (params['afterSequence'] == 12) {
          return {'messages': <dynamic>[]};
        }
        return {
          'messages': [
            {
              'id': 'msg-1',
              'senderId': 'uuid-b',
              'content': 'hello',
              'createdAt': DateTime.utc(2026, 1, 2).toIso8601String(),
              'conversationSequence': 12,
            },
          ],
        };
      });

      when(() => cacheRepo.saveMessages(any())).thenAnswer((_) async {});
      when(() => cacheRepo.saveMetadata(any())).thenAnswer((_) async {});
      when(() => cacheRepo.saveIndex(any())).thenAnswer((_) async {});

      await engine.syncDelta(
        chatId: chatId,
        path: 'direct-chat/messages',
        baseParams: {'partnerId': 'uuid-b', 'limit': 75},
        partnerClerkId: null,
        myUserId: 'uuid-a',
      );

      expect(callCount, 2);
      verify(
        () => remoteRepo.fetchMessages(
          path: 'direct-chat/messages',
          queryParameters: any(
            named: 'queryParameters',
            that: predicate<Map<String, dynamic>>(
              (params) => params['afterSequence'] == 0,
            ),
          ),
        ),
      ).called(1);
    });
  });
}
