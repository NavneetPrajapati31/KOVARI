import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/providers/profile_provider.dart';
import '../../core/services/haptic_service.dart';
import '../../core/config/interaction_config.dart';
import '../utils/kovari_icons.dart';
import '../utils/url_utils.dart';
import 'kovari_avatar.dart';

class KovariBottomNav extends ConsumerWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const KovariBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profilePhoto = ref.watch(
      profileProvider.select((p) => UrlUtils.getFullImageUrl(p?.profileImage)),
    );
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      bottom: true,
      child: Container(
        height: 100,
        padding: const EdgeInsets.fromLTRB(
          16,
          0,
          16,
          6,
        ), // Tighter screen margin
        alignment: Alignment.bottomCenter,
        color: Colors.transparent,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(40), // More rounded ends
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
            child: Container(
              height: 62,
              padding: const EdgeInsets.symmetric(
                horizontal: 6,
              ), // Added for corner breathing room
              decoration: BoxDecoration(
                color: (isDark ? AppColors.cardDark : AppColors.card)
                    .withValues(
                      alpha: 0.90, // Darker, richer glass
                    ),
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: AppColors.borderColor(context)),
              ),
              child: Stack(
                children: [
                  // Active Indicator (Large Wide Pill)
                  AnimatedAlign(
                    duration: InteractionConfig.medium,
                    curve: Curves.easeOutCubic,
                    alignment: Alignment(
                      -1.0 + (currentIndex * (2.0 / 4.0)),
                      0.0,
                    ),
                    child: FractionallySizedBox(
                      widthFactor: 1 / 5,
                      child: Center(
                        child: Container(
                          width: 70, // Wider like iOS 26
                          height: 50, // Taller pill
                          decoration: BoxDecoration(
                            color: AppColors.borderColor(context),
                            borderRadius: BorderRadius.circular(28),
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Items
                  Row(
                    children: [
                      _buildNavItem(context, 0, 'home', 'Home'),
                      _buildNavItem(context, 1, 'search', 'Explore'),
                      _buildNavItem(context, 2, 'send', 'Chats'),
                      _buildNavItem(context, 3, 'users', 'Groups'),
                      _buildAvatarNavItem(context, 4, profilePhoto, 'Profile'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    int index,
    String iconType,
    String label,
  ) {
    final isSelected = currentIndex == index;
    final color = isSelected
        ? AppColors.primary
        : AppColors.text(context, isMuted: true);

    String svgString = '';
    switch (iconType) {
      case 'home':
        svgString = KovariIcons.getHome(
          isFilled: isSelected,
          color: 'currentColor',
        );
      case 'search':
        svgString = KovariIcons.getSearch(
          isFilled: false,
          strokeWidth: isSelected ? 3.5 : 2.5, // Even bolder selected stroke
          color: 'currentColor',
        );
      case 'send':
        svgString = KovariIcons.getSend(
          isFilled: isSelected,
          color: 'currentColor',
        );
      case 'users':
        svgString = KovariIcons.getUsers(
          isFilled: isSelected,
          color: 'currentColor',
        );
    }

    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticService.selection();
          onTap(index);
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              height: 30, // Standardized height for icons/avatars
              child: Center(
                child: KovariIcon(svgString: svgString, size: 20, color: color),
              ),
            ),
            // const SizedBox(height: 1), // Unified spacing
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.text(context, isMuted: true),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarNavItem(
    BuildContext context,
    int index,
    String? profilePhoto,
    String label,
  ) {
    final isSelected = currentIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticService.selection();
          onTap(index);
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              height: 30, // Matching height for avatar
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(1.0),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : Colors.transparent,
                      width: 1.5,
                    ),
                  ),
                  child: KovariAvatar(
                    imageUrl: profilePhoto,
                    size: 22,
                    isSelected: isSelected,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 1), // Unified spacing
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.text(context, isMuted: true),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
