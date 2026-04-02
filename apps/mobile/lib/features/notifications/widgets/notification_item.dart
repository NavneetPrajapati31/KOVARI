import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/notification_model.dart';

class NotificationItem extends StatelessWidget {
  final MockNotification notification;
  final VoidCallback? onTap;

  const NotificationItem({super.key, required this.notification, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          color: notification.isRead
              ? Colors.transparent
              : AppColors.primaryLight,
          border: const Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildAvatar(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: AppTextStyles.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.message,
                          style: AppTextStyles.label.copyWith(
                            fontSize: 12,
                            color: AppColors.mutedForeground,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        ' · ',
                        style: AppTextStyles.label.copyWith(
                          color: AppColors.mutedForeground.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                      Text(
                        _formatTime(notification.createdAt),
                        style: AppTextStyles.label.copyWith(
                          fontSize: 11,
                          color: AppColors.mutedForeground.withValues(
                            alpha: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              LucideIcons.chevronRight,
              size: 14,
              color: AppColors.mutedForeground,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (notification.type == NotificationType.reportSubmitted) {
      return Container(
        width: 40,
        height: 40,
        decoration: const BoxDecoration(
          color: AppColors.secondary,
          shape: BoxShape.circle,
        ),
        child: const Icon(
          LucideIcons.check,
          size: 18,
          color: AppColors.foreground,
        ),
      );
    }

    if (notification.imageUrl != null) {
      return CircleAvatar(
        radius: 20,
        backgroundColor: AppColors.secondary,
        backgroundImage: NetworkImage(notification.imageUrl!),
      );
    }

    return Container(
      width: 40,
      height: 40,
      decoration: const BoxDecoration(
        color: AppColors.secondary,
        shape: BoxShape.circle,
      ),
      child: Center(child: _getTypeIcon()),
    );
  }

  Widget _getTypeIcon() {
    switch (notification.type) {
      case NotificationType.groupInviteReceived:
      case NotificationType.groupJoinRequestReceived:
      case NotificationType.groupJoinApproved:
        return const Icon(
          LucideIcons.users,
          size: 20,
          color: AppColors.mutedForeground,
        );
      case NotificationType.newMessage:
        return const Icon(
          LucideIcons.messageSquare,
          size: 20,
          color: AppColors.mutedForeground,
        );
      default:
        return const Icon(
          LucideIcons.user,
          size: 20,
          color: AppColors.mutedForeground,
        );
    }
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }
}
