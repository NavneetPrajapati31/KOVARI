import 'dart:io';
import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/gestures.dart';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/realtime/realtime_coordinator.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/chat/models/conversation_entity.dart';
import 'package:mobile/features/chat/models/message_entity.dart';
import 'package:mobile/features/chat/providers/chat_media_service.dart';
import 'package:mobile/features/chat/providers/chat_mutation_service.dart';
import 'package:mobile/features/chat/providers/chat_runtime_providers.dart';
import 'package:mobile/features/chat/providers/conversation_store.dart';
import 'package:mobile/features/chat/providers/message_store.dart';
import 'package:mobile/features/chat/utils/direct_chat_id.dart';
import 'package:mobile/shared/widgets/kovari_avatar.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:mobile/core/security/encryption_service.dart';

/// Individual chat screen. Receives [chatId] and loads everything from
/// [MessageStore] + [ConversationStore]. Wires the input bar to
/// [ChatMutationService.sendMessage] for offline-resilient sends.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.chatId});

  final String chatId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();
  bool _isComposing = false;
  bool _isSending = false;

  String get _chatId => widget.chatId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      Future.microtask(() {
        ref.read(activeConversationProvider.notifier).set(_chatId);
      });
      ref.read(realtimeCoordinatorProvider.notifier).joinChat(_chatId);
    });
  }

  @override
  void dispose() {
    ref.read(realtimeCoordinatorProvider.notifier).leaveChat(_chatId);
    final activeId = ref.read(activeConversationProvider);
    if (activeId == _chatId) {
      ref.read(activeConversationProvider.notifier).set(null);
    }
    _inputController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isSending) return;

    final user = ref.read(authProvider).user;
    if (user == null) return;

    final myUuid = user.resolvedUuid;
    if (myUuid == null) {
      AppLogger.w(
        '🛡️ [ChatScreen] User UUID missing for ClerkID: ${user.id}. Triggering emergency sync...',
      );
      ref.read(authProvider.notifier).syncProfile();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Synchronizing identity... please try again in a moment.',
          ),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final receiverId = directChatPartnerId(
      _chatId,
      user.id,
      myUserUuid: myUuid,
    );
    if (receiverId == null) {
      AppLogger.e(
        '🛡️ [ChatScreen] Cannot send message: Could not resolve receiver from chatId',
      );
      return;
    }

    print('🚀 [ChatScreen] _sendMessage: "$text" | chatId: $_chatId');
    setState(() {
      _isSending = true;
      _isComposing = false;
    });

    HapticFeedback.lightImpact();
    _inputController.clear();

    // Asynchronously send the message (includes encryption)
    final conversation = ref.read(conversationProvider(_chatId));
    ref
        .read(chatMutationServiceProvider)
        .sendMessage(
          chatId: _chatId,
          senderId: myUuid,
          text: text,
          receiverId: receiverId,
          senderClerkId: user.id,
          receiverClerkId: conversation?.partnerClerkId,
        );

    // Release the lock after a small delay to prevent rapid-fire clicks
    // but keep the UI responsive. Modern apps use ~200ms.
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() => _isSending = false);
      }
    });

    // Scroll to bottom after send
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0, // reverse list — 0 = bottom
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    print('📺 [ChatScreen] Building for ID: $_chatId');
    final conversation = ref.watch(
      conversationStoreProvider.select((map) => map[_chatId]),
    );
    final ConversationMessageState msgState = ref.watch(
      messageStoreProvider(_chatId),
    );
    print(
      '📺 [ChatScreen] MsgState: ${msgState.messages.length} msgs | Loading: ${msgState.isHydrating}',
    );
    final currentUserId = ref.watch(authProvider).user?.id ?? '';
    final isDark = AppColors.isDark(context);

    // Auto-scroll when new messages arrive
    ref.listen(
      messageStoreProvider(_chatId).select((s) => s.orderedIds.length),
      (_, __) => WidgetsBinding.instance.addPostFrameCallback(
        (_) => _scrollToBottom(),
      ),
    );

    return Scaffold(
      backgroundColor: AppColors.backgroundColor(context),
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // Layer 1: Messages (Full Height)
          (msgState.messages.isEmpty && msgState.isHydrating)
              ? SizedBox(
                  width: MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height,
                  child: Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      color: AppColors.primary,
                    ),
                  ),
                )
              : (msgState.messages.isEmpty && !msgState.isHydrating)
              ? _EmptyState(isDark: isDark)
              : _MessageList(
                  messages: msgState.hotMessages,
                  currentUserId: currentUserId,
                  scrollController: _scrollController,
                  isDark: isDark,
                ),

          // Layer 2: Bottom Content Mask Gradient (Absolute Sync with KovariBottomNav)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 100,
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: const [0.0, 0.2, 0.5, 0.8, 1.0],
                    colors: [
                      Colors.transparent,
                      AppColors.backgroundColor(
                        context,
                      ).withValues(alpha: isDark ? 0.1 : 0.05),
                      AppColors.backgroundColor(
                        context,
                      ).withValues(alpha: isDark ? 0.4 : 0.3),
                      AppColors.backgroundColor(
                        context,
                      ).withValues(alpha: isDark ? 0.8 : 0.8),
                      AppColors.backgroundColor(
                        context,
                      ).withValues(alpha: isDark ? 0.9 : 1.0),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Layer 3: Floating Triple-Pod Header
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            child: SizedBox(
              height: 40,
              child: Stack(
                children: [
                  // Left: Back Action
                  Align(
                    alignment: Alignment.centerLeft,
                    child: _ActionPod(
                      icon: LucideIcons.chevronLeft,
                      onPressed: () => Navigator.of(context).pop(),
                      backgroundColor: AppColors.cardColor(
                        context,
                      ).withValues(alpha: 0.5),
                      iconColor: AppColors.text(context, isMuted: true),
                      iconSize: 20,
                    ),
                  ),

                  // Center: Title Pod (Absolute Center)
                  Align(
                    alignment: Alignment.center,
                    child: _ChatAppBar(
                      conversation: conversation,
                      chatId: _chatId,
                    ),
                  ),

                  // Right: Profile/Partner Action
                  Align(
                    alignment: Alignment.centerRight,
                    child: _AvatarPod(
                      conversation: conversation,
                      onPressed: () {
                        // Future: Partner Profile
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Layer 3: Floating UI (Bottom Aligned)
          Align(
            alignment: Alignment.bottomCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (conversation != null)
                  _TypingIndicator(conversation: conversation),
                _InputBar(
                  chatId: _chatId,
                  controller: _inputController,
                  focusNode: _focusNode,
                  isComposing: _isComposing,
                  isSending: _isSending,
                  onChanged: (val) {
                    final composing = val.trim().isNotEmpty;
                    if (composing != _isComposing) {
                      setState(() => _isComposing = composing);
                      if (composing) {
                        ref
                            .read(realtimeCoordinatorProvider.notifier)
                            .startTyping(_chatId);
                      } else {
                        ref
                            .read(realtimeCoordinatorProvider.notifier)
                            .stopTyping(_chatId);
                      }
                    }
                  },
                  onSend: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── App Bar ────────────────────────────────────────────────────────────────

class _ChatAppBar extends ConsumerWidget {
  const _ChatAppBar({required this.conversation, required this.chatId});

  final ConversationEntity? conversation;
  final String chatId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.cardColor(context).withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.borderColor(context), width: 1),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 38),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    conversation?.displayName ?? '…',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                      color: AppColors.text(context, isMuted: true),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  Text(
                    conversation?.isPartnerOnline == true
                        ? 'online'
                        : _formatLastSeen(conversation?.partnerLastSeen),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: conversation?.isPartnerOnline == true
                          ? AppColors.primary
                          : AppColors.text(context, isMuted: true),
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatLastSeen(DateTime? lastSeen) {
    if (lastSeen == null) return 'Offline';
    final localLastSeen = lastSeen.toLocal();
    final diff = DateTime.now().difference(localLastSeen);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return DateFormat.jm().format(localLastSeen);
    return DateFormat.MMMd().format(localLastSeen);
  }
}

class _AvatarPod extends StatelessWidget {
  const _AvatarPod({required this.conversation, this.onPressed});

  final ConversationEntity? conversation;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        if (onPressed != null) {
          HapticFeedback.lightImpact();
          onPressed!();
        }
      },
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.cardColor(context).withValues(alpha: 0.5),
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.borderColor(context),
                width: 1,
              ),
            ),
            child: Center(
              child: KovariAvatar(
                imageUrl: conversation?.displayAvatar,
                fullName: conversation?.displayName ?? '?',
                size: 34,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Message List ────────────────────────────────────────────────────────────

class _MessageList extends StatelessWidget {
  const _MessageList({
    required this.messages,
    required this.currentUserId,
    required this.scrollController,
    required this.isDark,
  });

  final List<MessageEntity> messages;
  final String currentUserId;
  final ScrollController scrollController;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    final topPad = MediaQuery.of(context).padding.top;

    // Production-Grade Robustness: Explicit Temporal Sorting
    // Regardless of how the provider or optimistic UI inserts messages,
    // we force a strict Newest-First order for the ListView.
    final displayMessages = List<MessageEntity>.from(messages)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return ListView.builder(
      controller: scrollController,
      reverse: true, // index 0 is bottom (newest).
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      padding: EdgeInsets.fromLTRB(16, 80 + topPad, 16, 60 + bottomPad),
      itemCount: displayMessages.length,
      itemBuilder: (context, index) {
        final msg = displayMessages[index];
        final isMe = msg.senderId == currentUserId;
        final showTimestamp = _shouldShowTimestamp(index, displayMessages);

        return Column(
          children: [
            if (showTimestamp) _DateDivider(date: msg.createdAt),
            RepaintBoundary(
              child: _MessageBubble(message: msg, isMe: isMe, isDark: isDark),
            ),
          ],
        );
      },
    );
  }

  bool _shouldShowTimestamp(int index, List<MessageEntity> msgs) {
    // msgs is GUARANTEED newest-first here.
    // index 0 is newest (bottom).
    // Show timestamp if it's the oldest message (last in list)
    // or if the message AFTER it (older) is on a different day.
    if (index == msgs.length - 1) return true;

    final curr = msgs[index].createdAt.toLocal();
    final older = msgs[index + 1].createdAt.toLocal();

    return curr.day != older.day ||
        curr.month != older.month ||
        curr.year != older.year;
  }
}

// ── Message Bubble ──────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.isDark,
  });

  final MessageEntity message;
  final bool isMe;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final bubbleColor = isMe
        ? AppColors.primary
        : (isDark ? AppColors.mutedDark : const Color(0xFFF1F5F9));

    final textColor = isMe
        ? Colors.white
        : (isDark ? AppColors.foregroundDark : AppColors.foreground);

    final timeString = DateFormat.jm().format(message.createdAt.toLocal());
    final hasMedia = message.localFilePath != null || message.mediaUrl != null;

    if (hasMedia) {
      return Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.borderColor(context)),
            borderRadius: BorderRadius.circular(20),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              alignment: Alignment.bottomRight,
              children: [
                // 🖼️ Media Content
                SizedBox(
                  height: 200,
                  width: double.infinity,
                  child: message.mediaType == 'image'
                      ? (message.localFilePath != null
                            ? Image.file(
                                File(message.localFilePath!),
                                fit: BoxFit.cover,
                              )
                            : _EncryptedImage(
                                url: message.mediaUrl!,
                                iv: message.encryptionIv ?? '',
                                salt: message.encryptionSalt ?? '',
                                chatId: message.chatId,
                                placeholder: Container(
                                  height: 200,
                                  color: AppColors.surface(context, level: 2),
                                  child: const Center(
                                    child: SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 3,
                                      ),
                                    ),
                                  ),
                                ),
                              ))
                      : Container(
                          height: 200,
                          color: AppColors.surface(context, level: 2),
                          child: const Center(
                            child: Icon(LucideIcons.video, size: 40),
                          ),
                        ),
                ),

                // 💎 Instagram-Pro: Upload Progress Overlay
                if (message.mediaUploadState == MediaUploadState.uploading)
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.4),
                      child: Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            value: message.uploadProgress > 0
                                ? message.uploadProgress
                                : null,
                            color: Colors.white,
                            strokeWidth: 3,
                          ),
                        ),
                      ),
                    ),
                  ),

                // 🕒 Timestamp & Status Overlay
                Container(
                  margin: const EdgeInsets.all(8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        timeString,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (isMe) ...[
                        const SizedBox(width: 4),
                        _DeliveryIcon(
                          status: message.deliveryStatus,
                          isMe: true,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isMe ? 18 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 18),
          ),
        ),
        child: IntrinsicWidth(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (message.text != null && message.text!.isNotEmpty)
                _LinkifiedText(
                  text: message.text!,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: textColor,
                    fontSize: 13,
                    height: 1.4,
                  ),
                  linkColor: isMe ? Colors.white : AppColors.primary,
                )
              else
                Text(
                  '🔒 Encrypted message',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: textColor.withValues(alpha: 0.6),
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              const SizedBox(height: 1),
              Align(
                alignment: Alignment.centerRight,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      timeString,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 10,
                        color: isMe
                            ? Colors.white70
                            : AppColors.text(context, isMuted: true),
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      _DeliveryIcon(status: message.deliveryStatus, isMe: isMe),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Delivery Status Icon ────────────────────────────────────────────────────

class _DeliveryIcon extends StatelessWidget {
  const _DeliveryIcon({required this.status, required this.isMe});

  final MessageDeliveryStatus status;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (status) {
      MessageDeliveryStatus.pending => (
        LucideIcons.clock,
        isMe ? Colors.white70 : AppColors.text(context, isMuted: true),
      ),
      MessageDeliveryStatus.sent => (
        LucideIcons.check,
        isMe ? Colors.white70 : AppColors.text(context, isMuted: true),
      ),
      MessageDeliveryStatus.delivered => (
        LucideIcons.checkCheck,
        isMe ? Colors.white70 : AppColors.text(context, isMuted: true),
      ),
      MessageDeliveryStatus.seen => (LucideIcons.checkCheck, Colors.white),
      MessageDeliveryStatus.failed => (
        LucideIcons.circleAlert,
        const Color(0xFFFF3B30),
      ),
    };

    return Icon(icon, size: 12, color: color);
  }
}

// ── Date Divider ────────────────────────────────────────────────────────────

class _DateDivider extends StatelessWidget {
  const _DateDivider({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final dateLocal = date.toLocal();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final msgDate = DateTime(dateLocal.year, dateLocal.month, dateLocal.day);

    String label;
    if (msgDate == today) {
      label = 'Today';
    } else if (msgDate == yesterday) {
      label = 'Yesterday';
    } else {
      label = DateFormat.MMMMd().format(dateLocal);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: isDark ? AppColors.mutedDark : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.text(context, isMuted: true),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Typing Indicator ────────────────────────────────────────────────────────

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator({required this.conversation});

  final ConversationEntity conversation;

  @override
  Widget build(BuildContext context) {
    final typingIds = conversation.typingUserIds;
    if (typingIds.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _TypingDots(),
            const SizedBox(width: 6),
            Text(
              conversation.isGroup
                  ? '${typingIds.length} typing…'
                  : '${conversation.partnerName ?? 'Someone'} is typing…',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.text(context, isMuted: true),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        final offset = (i / 3);
        final val = ((_anim.value + offset) % 1.0);
        final opacity = (val < 0.5 ? val * 2 : (1 - val) * 2).clamp(0.3, 1.0);
        return Container(
          margin: const EdgeInsets.only(right: 2),
          width: 5,
          height: 5,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: opacity),
            shape: BoxShape.circle,
          ),
        );
      }),
    ),
  );
}

// ── Input Bar ───────────────────────────────────────────────────────────────

class _InputBar extends ConsumerWidget {
  const _InputBar({
    required this.chatId,
    required this.controller,
    required this.focusNode,
    required this.isComposing,
    required this.isSending,
    required this.onChanged,
    required this.onSend,
  });

  final String chatId;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isComposing;
  final bool isSending;
  final ValueChanged<String> onChanged;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    final pillBg = AppColors.cardColor(
      context,
    ).withValues(alpha: 0.5); // Absolute match with bottom nav surface

    return Container(
      padding: EdgeInsets.fromLTRB(16, 6, 16, 10 + bottomPad),
      decoration: const BoxDecoration(color: Colors.transparent),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Attachment Button
          _ActionPod(
            icon: LucideIcons.paperclip,
            onPressed: () {
              // 💎 Instagram-Pro: Media Picker Bottom Sheet
              showModalBottomSheet<void>(
                context: context,
                backgroundColor: AppColors.surface(context, level: 1),
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (context) => SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 8),
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.borderColor(context),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        visualDensity: VisualDensity.compact,
                        dense: true,
                        leading: Icon(
                          LucideIcons.camera,
                          size: 22,
                          color: AppColors.text(context, isMuted: true),
                        ),
                        title: Text(
                          'Camera',
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.text(context, isMuted: true),
                          ),
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          ref
                              .read(chatMediaServiceProvider)
                              .pickAndSendImage(chatId, ImageSource.camera);
                        },
                      ),
                      ListTile(
                        visualDensity: VisualDensity.compact,
                        dense: true,
                        leading: Icon(
                          LucideIcons.image,
                          size: 22,
                          color: AppColors.text(context, isMuted: true),
                        ),
                        title: Text(
                          'Gallery',
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.text(context, isMuted: true),
                          ),
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          ref
                              .read(chatMediaServiceProvider)
                              .pickAndSendImage(chatId, ImageSource.gallery);
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              );
            },
            backgroundColor: pillBg,
            iconColor: AppColors.text(context, isMuted: true),
          ),
          const SizedBox(width: 8),

          Expanded(
            child: GestureDetector(
              onTap: () => focusNode.requestFocus(),
              behavior: HitTestBehavior.opaque,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 40),
                    decoration: BoxDecoration(
                      color: pillBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.borderColor(context),
                        width: 1,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: controller,
                            focusNode: focusNode,
                            maxLines: 4,
                            minLines: 1,
                            textAlignVertical: TextAlignVertical.center,
                            textCapitalization: TextCapitalization.sentences,
                            keyboardType: TextInputType.multiline,
                            onChanged: onChanged,
                            cursorColor: AppColors.primary,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.text(context),
                              fontSize: 14,
                            ),
                            decoration: InputDecoration(
                              isDense: true,
                              filled: true,
                              fillColor: Colors.transparent,
                              hintText: 'Message',
                              hintStyle: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.text(context, isMuted: true),
                                fontSize: 12,
                              ),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Action Button (Send or Camera)
          _ActionPod(
            icon: LucideIcons.sendHorizontal,
            onPressed: isSending ? null : onSend,
            backgroundColor: pillBg,
            iconColor: AppColors.text(context, isMuted: true),
          ),
        ],
      ),
    );
  }
}

class _ActionPod extends StatelessWidget {
  const _ActionPod({
    required this.icon,
    this.onPressed,
    required this.backgroundColor,
    this.iconColor,
    this.iconSize,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color? iconColor;
  final double? iconSize;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        if (onPressed != null) {
          HapticFeedback.lightImpact();
          onPressed!();
        }
      },
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: backgroundColor,
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.borderColor(context),
                width: 1,
              ),
            ),
            child: Center(
              child: Icon(
                icon,
                color:
                    iconColor ?? AppColors.text(context).withValues(alpha: 0.8),
                size: iconSize ?? 16,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Empty State ─────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          LucideIcons.messageCircle,
          size: 48,
          color: AppColors.text(context, isMuted: true).withValues(alpha: 0.4),
        ),
        const SizedBox(height: 12),
        Text(
          'No messages yet',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.text(context, isMuted: true),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Send the first message!',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.text(
              context,
              isMuted: true,
            ).withValues(alpha: 0.6),
          ),
        ),
      ],
    ),
  );
}
// ── Linkified Text ──────────────────────────────────────────────────────────

class _LinkifiedText extends StatelessWidget {
  const _LinkifiedText({
    required this.text,
    required this.style,
    required this.linkColor,
  });

  final String text;
  final TextStyle style;
  final Color linkColor;

  static final RegExp _urlRegex = RegExp(
    r'(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+',
    caseSensitive: false,
  );

  @override
  Widget build(BuildContext context) {
    final List<TextSpan> spans = [];
    final matches = _urlRegex.allMatches(text);

    int lastMatchEnd = 0;
    for (final match in matches) {
      // Add preceding non-link text
      if (match.start > lastMatchEnd) {
        spans.add(
          TextSpan(
            text: text.substring(lastMatchEnd, match.start),
            style: style,
          ),
        );
      }

      // Add link text
      final url = match.group(0)!;
      spans.add(
        TextSpan(
          text: url,
          style: style.copyWith(color: linkColor, fontWeight: FontWeight.w600),
          recognizer: TapGestureRecognizer()
            ..onTap = () async {
              var uriString = url;
              if (!uriString.startsWith('http')) {
                uriString = 'https://$uriString';
              }
              final uri = Uri.tryParse(uriString);
              if (uri != null) {
                try {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } catch (e) {
                  AppLogger.e(
                    '[LinkifiedText] Could not launch URL: $url',
                    error: e,
                  );
                }
              }
            },
        ),
      );
      lastMatchEnd = match.end;
    }

    // Add remaining text
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd), style: style));
    }

    return RichText(text: TextSpan(children: spans));
  }
}

class _EncryptedImage extends StatefulWidget {
  const _EncryptedImage({
    required this.url,
    required this.iv,
    required this.salt,
    required this.chatId,
    this.placeholder,
  });

  final String url;
  final String iv;
  final String salt;
  final String chatId;
  final Widget? placeholder;

  @override
  State<_EncryptedImage> createState() => _EncryptedImageState();
}

class _EncryptedImageState extends State<_EncryptedImage> {
  Uint8List? _imageBytes;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAndDecrypt();
  }

  Future<void> _loadAndDecrypt() async {
    try {
      // 1. Download encrypted bytes
      final response = await Dio().get<List<int>>(
        widget.url,
        options: Options(responseType: ResponseType.bytes),
      );

      if (response.data == null) throw Exception('No data received');

      // 2. Decrypt
      final encryption = EncryptionService();
      final sharedSecret = widget.chatId.replaceAll('_', ':');
      final decrypted = await encryption.decryptBytes(
        cipherText: Uint8List.fromList(response.data!),
        iv: encryption.hexDecode(widget.iv),
        salt: encryption.hexDecode(widget.salt),
        key: sharedSecret,
      );

      if (mounted) {
        setState(() {
          _imageBytes = decrypted;
        });
      }
    } catch (e) {
      AppLogger.e('🛡️ [_EncryptedImage] Failed to load/decrypt', error: e);
      if (mounted) {
        setState(() {
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Container(
        height: 200,
        width: double.infinity,
        color: AppColors.surface(context, level: 2),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.circleAlert, color: AppColors.destructive),
              const SizedBox(height: 8),
              Text(
                'Decryption Error',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.destructive,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_imageBytes == null) {
      return widget.placeholder ?? const SizedBox(height: 200);
    }

    return Image.memory(
      _imageBytes!,
      fit: BoxFit.cover,
      width: double.infinity,
    );
  }
}
