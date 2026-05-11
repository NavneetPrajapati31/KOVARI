import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/skeletons/kovari_skeletons.dart';
import '../../../notifications/providers/notification_provider.dart';
import 'package:mobile/core/navigation/routes.dart';
import '../../../../core/utils/app_logger.dart';

class HomeHeader extends ConsumerWidget {
  final String firstName;
  final bool isLoading;

  const HomeHeader({
    super.key,
    this.firstName = 'User',
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch unread count for robust, reactive badge updates
    final unreadCountAsync = ref.watch(unreadCountProvider);
    final unreadCount = unreadCountAsync.value ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (isLoading)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Skeleton(width: 100, height: 16),
                const SizedBox(height: 4),
                const Skeleton(width: 160, height: 14),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi, $firstName',
                  style: AppTextStyles.h3.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text(context),
                  ),
                ),
                Text(
                  'Welcome back to Kovari 👋🏻',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.text(context, isMuted: true),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          if (isLoading)
            const Skeleton(width: 64, height: 20)
          else
            Row(
              children: [
                _buildIconButton(
                  context,
                  icon: LucideIcons.bell,
                  showBadge: unreadCount > 0,
                  onTap: () {
                    AppLogger.d('🔔 [Header] Navigating to Notifications');
                    context.push('/notifications');
                  },
                ),
                const SizedBox(width: AppSpacing.xs),
                _buildIconButton(
                  context,
                  icon: LucideIcons.heart,
                  onTap: () {
                    AppLogger.d('❤️ [Header] Navigating to Requests');
                    context.push('/requests');
                  },
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildIconButton(
    BuildContext context, {
    required IconData icon,
    bool showBadge = false,
    VoidCallback? onTap,
  }) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Icon(icon, size: 20, color: AppColors.text(context)),
          ),
        ),
        if (showBadge)
          Positioned(
            top: 2,
            right: 2,
            child: IgnorePointer(
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.surface(context),
                    width: 2,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
