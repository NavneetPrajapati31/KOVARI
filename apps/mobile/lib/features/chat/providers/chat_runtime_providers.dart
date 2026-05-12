import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/chat/providers/message_store.dart';

// ---------------------------------------------------------------------------
// Active Conversation Tracker
// ---------------------------------------------------------------------------

/// Tracks which chatId the user is currently viewing.
/// `null` = inbox / no active chat open.
///
/// Setting this drives selective hydration:
///   - Active conversation → full [MessageStore] (hot message window)
///   - Background conversations → [ConversationEntity] metadata only
class ActiveConversationNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? chatId) => state = chatId;
}

final activeConversationProvider =
    NotifierProvider<ActiveConversationNotifier, String?>(
      ActiveConversationNotifier.new,
    );

// ---------------------------------------------------------------------------
// Selective Hydration
// ---------------------------------------------------------------------------

/// Listens to [activeConversationProvider] and manages which conversation
/// has a live [MessageStore] hot-window open.
///
/// Mount once in [runtimeInitProvider]. Self-managing — no widget wiring needed.
final selectiveHydrationProvider = Provider<void>((ref) {
  ref.listen<String?>(activeConversationProvider, (previous, next) {
    if (previous != null && previous != next) {
      // autoDispose on messageStoreProvider automatically evicts the old store
      // when no widget is watching it. Log for observability.
      AppLogger.d('[SelectiveHydration] Released hot window for: $previous');
    }
    if (next != null) {
      // Eagerly allocate the store so it's warm before the chat screen builds.
      ref.read(messageStoreProvider(next).notifier);
      AppLogger.i('[SelectiveHydration] Activated hot window for: $next');
    }
  });
});

// ---------------------------------------------------------------------------
// Socket Token Re-injection on Auth Refresh
// ---------------------------------------------------------------------------

/// Watches [authProvider] for silent token refreshes (same userId, new token).
/// Forces the [SocketService] to reconnect with fresh credentials so the
/// socket never holds a stale/expired access token.
final socketTokenRefreshWatcherProvider = Provider<void>((ref) {
  ref.listen<AuthState>(authProvider, (previous, next) {
    // Only reconnect if a token refresh cycle just COMPLETED.
    // We detect this by seeing isRefreshing transition from true -> false
    // while the user is still authenticated.
    final refreshFinished =
        previous?.isRefreshing == true && next.isRefreshing == false;
    final userChanged = previous?.user?.id != next.user?.id;

    if ((refreshFinished || userChanged) && next.isAuthenticated) {
      AppLogger.i(
        '[SocketTokenRefresh] Reconnecting socket (refreshFinished: $refreshFinished, userChanged: $userChanged)',
      );
      // Use the non-destructive reconnect method instead of invalidation
      // to keep the event stream alive and prevent dropping ACKs.
      ref.read(socketServiceProvider.notifier).reconnectWithToken();
    }
  });
});
