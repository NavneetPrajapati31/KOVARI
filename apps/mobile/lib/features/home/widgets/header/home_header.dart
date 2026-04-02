import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';

class HomeHeader extends StatelessWidget {
  final String firstName;
  final int unreadNotificationsCount;

  const HomeHeader({
    super.key,
    this.firstName = 'User',
    this.unreadNotificationsCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hi, $firstName',
                style: AppTextStyles.h3.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              // const SizedBox(height: 2),
              Text(
                'Welcome back to Kovari 👋🏻',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.mutedForeground,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Row(
            children: [
              _buildIconButton(
                icon: LucideIcons.bell,
                showBadge: unreadNotificationsCount > 0,
                onTap: () {
                  // Navigate to notifications
                },
              ),
              const SizedBox(width: AppSpacing.md),
              _buildIconButton(
                icon: LucideIcons.heart,
                onTap: () {
                  // Navigate to requests
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    bool showBadge = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon, size: 20, color: AppColors.foreground),
          if (showBadge)
            Positioned(
              top: -1,
              right: -0.5,
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
