import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_radius.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/kovari_avatar.dart';

class MockConversation { // 'image', 'video', 'init', null

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
  final String id;
  final String userId;
  final String name;
  final String? profilePhoto;
  final String lastMessage;
  final String lastMessageAt;
  final int unreadCount;
  final bool isOnline;
  final bool isTyping;
  final String? lastMediaType;
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
    final filteredConversations = _conversations.where((c) => c.name.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

    return CustomScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        // Search Bar (SliverToBoxAdapter) with Status Bar Padding
        SliverToBoxAdapter(
          child: Container(
            padding: EdgeInsets.fromLTRB(
              16.0,
              MediaQuery.of(context).padding.top + 16.0,
              16.0,
              16.0,
            ),
            decoration: BoxDecoration(color: AppColors.surface(context)),
            child: SizedBox(
              height: 44,
              child: TextField(
                controller: _searchController,
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val;
                  });
                },
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.text(context),
                  fontWeight: FontWeight.w400,
                ),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surface(context, level: 2),
                  hintText: 'Search',
                  hintStyle: TextStyle(
                    color: AppColors.text(context, isMuted: true),
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: Icon(
                            LucideIcons.x,
                            size: 16,
                            color: AppColors.text(context, isMuted: true),
                          ),
                          onPressed: _clearSearch,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        )
                      : Icon(
                          LucideIcons.search,
                          size: 18,
                          color: AppColors.text(context, isMuted: true),
                        ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(32),
                    borderSide: BorderSide(
                      color: AppColors.borderColor(context),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(32),
                    borderSide: BorderSide(
                      color: AppColors.borderColor(context),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(32),
                    borderSide: BorderSide(
                      color: AppColors.borderColor(context),
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                  ),
                ),
              ),
            ),
          ),
        ),

        // Messages List
        if (filteredConversations.isEmpty)
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Text(
                _searchQuery.isEmpty
                    ? 'No conversations yet.'
                    : 'No conversations found.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.text(context, isMuted: true),
                ),
              ),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.only(
              left: 16.0,
              right: 16.0,
              bottom: 16.0,
            ),
            sliver: SliverToBoxAdapter(
              child: AppCard(
                padding: EdgeInsets.zero,
                child: ClipRRect(
                  borderRadius: AppRadius.large,
                  clipBehavior: Clip.antiAliasWithSaveLayer,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (
                        int i = 0;
                        i < filteredConversations.length;
                        i++
                      ) ...[
                        RepaintBoundary(
                          child: _ChatInboxItem(
                            conversation: filteredConversations[i],
                            onTap: () {
                              // handle tap
                            },
                          ),
                        ),
                        if (i < filteredConversations.length - 1)
                          Divider(
                            height: 1,
                            color: AppColors.borderColor(context),
                          ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ],
    );
  }
}

class _ChatInboxItem extends StatelessWidget {

  const _ChatInboxItem({required this.conversation, required this.onTap});
  final MockConversation conversation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                DecoratedBox(
                  decoration: conversation.lastMediaType == 'init'
                      ? BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        )
                      : const BoxDecoration(),
                  child: KovariAvatar(
                    imageUrl: conversation.profilePhoto,
                    size: 42,
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
                        border: Border.all(
                          color: AppColors.surface(context, level: 1),
                          width: 2,
                        ),
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
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.text(context),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        conversation.lastMessageAt,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.text(context, isMuted: true),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 1),

                  // Bottom Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: _buildSubtitle(context)),
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

  Widget _buildSubtitle(BuildContext context) {
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
          Icon(
            LucideIcons.image,
            size: 14,
            color: AppColors.text(context, isMuted: true),
          ),
          const SizedBox(width: 4),
          Text(
            'Photo',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.text(context, isMuted: true),
              fontSize: 12,
            ),
          ),
        ],
      );
    }
    if (conversation.lastMediaType == 'video') {
      return Row(
        children: [
          Icon(
            LucideIcons.video,
            size: 14,
            color: AppColors.text(context, isMuted: true),
          ),
          const SizedBox(width: 4),
          Text(
            'Video',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.text(context, isMuted: true),
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
        color: AppColors.text(context, isMuted: true),
        fontSize: 12,
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
