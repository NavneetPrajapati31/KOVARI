import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/kovari_avatar.dart';

class MockConversation {
  final String id;
  final String userId;
  final String name;
  final String? profilePhoto;
  final String lastMessage;
  final String lastMessageAt;
  final int unreadCount;
  final bool isOnline;
  final bool isTyping;
  final String? lastMediaType; // 'image', 'video', 'init', null

  MockConversation({
    required this.id,
    required this.userId,
    required this.name,
    this.profilePhoto,
    required this.lastMessage,
    required this.lastMessageAt,
    this.unreadCount = 0,
    this.isOnline = false,
    this.isTyping = false,
    this.lastMediaType,
  });
}

class ChatInboxScreen extends StatefulWidget {
  const ChatInboxScreen({super.key});

  @override
  State<ChatInboxScreen> createState() => _ChatInboxScreenState();
}

class _ChatInboxScreenState extends State<ChatInboxScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Mock Data
  final List<MockConversation> _conversations = [
    MockConversation(
      id: '1',
      userId: 'u1',
      name: 'Alice Cooper',
      lastMessage: 'Sounds good, see you then!',
      lastMessageAt: '10:42 AM',
      unreadCount: 2,
      isOnline: true,
    ),
    MockConversation(
      id: '2',
      userId: 'u2',
      name: 'Bob Smith',
      lastMessage: '',
      lastMessageAt: 'Yesterday',
      isTyping: true,
      isOnline: true,
    ),
    MockConversation(
      id: '3',
      userId: 'u3',
      name: 'Charlie Davis',
      lastMessage: 'Photo',
      lastMessageAt: 'Mon',
      lastMediaType: 'image',
    ),
    MockConversation(
      id: '4',
      userId: 'u4',
      name: 'Diana Prince',
      lastMessage: '',
      lastMessageAt: 'Mar 15',
      lastMediaType: 'init',
      isOnline: false,
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _searchQuery = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final filteredConversations = _conversations.where((c) {
      return c.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Material(
      color: AppColors.card, // bg-card
      child: SafeArea(
        child: Column(
          children: [
            // Search Bar (Sticky Top)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: AppColors.border, width: 1),
                ),
              ),
              child: SizedBox(
                height: 38,
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val;
                    });
                  },
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.black,
                    fontWeight: FontWeight.w400,
                  ),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.secondary,
                    hintText: 'Search',
                    hintStyle: const TextStyle(
                      color: AppColors.mutedForeground,
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(LucideIcons.x, size: 16),
                            onPressed: _clearSearch,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          )
                        : const Icon(
                            LucideIcons.search,
                            size: 18,
                            color: AppColors.mutedForeground,
                          ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 0,
                    ),
                  ),
                ),
              ),
            ),

            // Messages List
            Expanded(
              child: filteredConversations.isEmpty
                  ? Center(
                      child: Text(
                        _searchQuery.isEmpty
                            ? 'No conversations yet.'
                            : 'No conversations found.',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    )
                  : ListView.builder(
                      itemCount: filteredConversations.length,
                      itemBuilder: (context, index) {
                        final conv = filteredConversations[index];
                        final isLast =
                            index == filteredConversations.length - 1;
                        return _ChatInboxItem(
                          conversation: conv,
                          isLast: isLast,
                          onTap: () {
                            // handle tap
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatInboxItem extends StatelessWidget {
  final MockConversation conversation;
  final bool isLast;
  final VoidCallback onTap;

  const _ChatInboxItem({
    required this.conversation,
    required this.isLast,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : const Border(
                  bottom: BorderSide(color: AppColors.border, width: 1),
                ),
        ),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                Container(
                  decoration: conversation.lastMediaType == 'init'
                      ? BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        )
                      : null,
                  child: KovariAvatar(
                    imageUrl: conversation.profilePhoto,
                    size: 44,
                    fullName: conversation.name,
                  ),
                ),
                if (conversation.isOnline)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.card, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Top Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          conversation.name,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.foreground,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        conversation.lastMessageAt,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  // const SizedBox(height: 1),

                  // Bottom Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: _buildSubtitle()),
                      if (conversation.unreadCount > 0)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 20,
                            minHeight: 20,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '${conversation.unreadCount}',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubtitle() {
    if (conversation.isTyping) {
      return Text(
        'typing...',
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.primary,
          fontSize: 12,
        ),
      );
    }
    if (conversation.lastMediaType == 'image') {
      return Row(
        children: [
          const Icon(
            LucideIcons.image,
            size: 14,
            color: AppColors.mutedForeground,
          ),
          const SizedBox(width: 4),
          Text(
            'Photo',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 12,
            ),
          ),
        ],
      );
    }
    if (conversation.lastMediaType == 'video') {
      return Row(
        children: [
          const Icon(
            LucideIcons.video,
            size: 14,
            color: AppColors.mutedForeground,
          ),
          const SizedBox(width: 4),
          Text(
            'Video',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 12,
            ),
          ),
        ],
      );
    }
    if (conversation.lastMediaType == 'init') {
      return Text(
        'Start a conversation!',
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.w500,
          fontSize: 12,
        ),
      );
    }
    return Text(
      conversation.lastMessage,
      style: AppTextStyles.bodySmall.copyWith(
        color: AppColors.mutedForeground,
        fontSize: 12,
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
