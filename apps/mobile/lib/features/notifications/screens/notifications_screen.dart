import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/notification_model.dart';
import '../widgets/notification_item.dart';
import '../../../core/widgets/common/skeleton.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  late List<MockNotification> _notifications;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    // Simulate loading
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() {
        _notifications = [
          MockNotification(
            id: '1',
            title: 'New Match Interest',
            message: 'Alex Johnson is interested in joining your Europe trip.',
            createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
            isRead: false,
            imageUrl: 'https://i.pravatar.cc/150?u=alex',
            type: NotificationType.matchInterestReceived,
          ),
          MockNotification(
            id: '2',
            title: 'Group Invitation',
            message: 'Sarah Miller invited you to "Tokyo Adventure".',
            createdAt: DateTime.now().subtract(const Duration(hours: 2)),
            isRead: false,
            type: NotificationType.groupInviteReceived,
          ),
          MockNotification(
            id: '3',
            title: 'Message Received',
            message: 'Hey, are we still meeting at the airport?',
            createdAt: DateTime.now().subtract(const Duration(hours: 5)),
            isRead: true,
            imageUrl: 'https://i.pravatar.cc/150?u=sarah',
            type: NotificationType.newMessage,
          ),
          MockNotification(
            id: '4',
            title: 'Report Submitted',
            message: 'Your travel report for "Bali 2023" has been approved.',
            createdAt: DateTime.now().subtract(const Duration(days: 1)),
            isRead: true,
            type: NotificationType.reportSubmitted,
          ),
          MockNotification(
            id: '5',
            title: 'Group Join Approved',
            message: 'Your request to join "Paris Explorers" was approved!',
            createdAt: DateTime.now().subtract(const Duration(days: 2)),
            isRead: true,
            type: NotificationType.groupJoinApproved,
          ),
        ];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.card,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(child: _isLoading ? _buildSkeleton() : _buildList()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          _buildBackButton(context),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Notifications',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              // markAllAsRead
            },
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text(
              'Mark all as read',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.all(4),
        child: const Icon(
          LucideIcons.chevronLeft,
          size: 20,
          color: AppColors.foreground,
        ),
      ),
    );
  }

  Widget _buildList() {
    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LucideIcons.bell,
              size: 24,
              color: AppColors.mutedForeground,
            ),
            const SizedBox(height: 12),
            Text(
              'No notifications',
              style: AppTextStyles.label.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        return NotificationItem(
          notification: _notifications[index],
          onTap: () {
            // handle tap
          },
        );
      },
    );
  }

  Widget _buildSkeleton() {
    return ListView.builder(
      itemCount: 8,
      itemBuilder: (context, index) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              const Skeleton.circle(size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Skeleton(width: 96, height: 12),
                        const Skeleton(width: 40, height: 12),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Skeleton(width: 128, height: 12),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
