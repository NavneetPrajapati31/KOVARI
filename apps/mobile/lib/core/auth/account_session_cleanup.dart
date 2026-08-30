import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/realtime/realtime_event_pipeline.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/runtime/mutation_journal.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/chat/providers/chat_runtime_providers.dart';
import 'package:mobile/features/chat/providers/conversation_runtime_store.dart';
import 'package:mobile/features/chat/providers/message_store.dart';
import 'package:mobile/features/chat/providers/pending_upload_store.dart';

/// Purges in-memory and persisted account-scoped chat state on logout or
/// account switch. Prevents BUG-C1a same-device multi-account session leakage.
Future<void> clearAccountScopedChatState(ProviderContainer container) async {
  AppLogger.i('[AccountSessionCleanup] Clearing account-scoped chat state');

  try {
    container.read(socketServiceProvider.notifier).disconnect();
  } catch (e) {
    AppLogger.w('[AccountSessionCleanup] Socket disconnect failed: $e');
  }

  try {
    container.read(conversationRuntimeStoreProvider.notifier).clearAccountState();
  } catch (e) {
    AppLogger.w('[AccountSessionCleanup] Runtime store clear failed: $e');
  }

  try {
    container.read(activeConversationProvider.notifier).set(null);
  } catch (e) {
    AppLogger.w('[AccountSessionCleanup] Active conversation reset failed: $e');
  }

  container.invalidate(messageStoreProvider);

  try {
    container.read(inboxLoadingProvider.notifier).state = false;
  } catch (_) {}

  try {
    await container.read(mutationJournalProvider).clearAll();
  } catch (e) {
    AppLogger.w('[AccountSessionCleanup] Mutation journal clear failed: $e');
  }

  try {
    await container.read(pendingUploadStoreProvider).clearAll();
  } catch (e) {
    AppLogger.w('[AccountSessionCleanup] Pending upload clear failed: $e');
  }

  try {
    container.read(realtimeEventPipelineProvider).clearPendingQueues();
  } catch (e) {
    AppLogger.w('[AccountSessionCleanup] Pipeline queue clear failed: $e');
  }
}
