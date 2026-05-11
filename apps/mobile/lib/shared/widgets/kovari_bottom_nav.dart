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

    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        // 🌌 iOS 26 Content Mask Gradient
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 120, // Slightly taller for a longer, smoother fade
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.0, 0.2, 0.5, 0.8, 1.0], // Cubic-style stops
                  colors: [
                    Colors.transparent,
                    (isDark ? AppColors.backgroundDark : AppColors.background)
                        .withValues(alpha: isDark ? 0.1 : 0.05),
                    (isDark ? AppColors.backgroundDark : AppColors.background)
                        .withValues(alpha: isDark ? 0.4 : 0.3),
                    (isDark ? AppColors.backgroundDark : AppColors.background)
                        .withValues(alpha: isDark ? 0.8 : 0.8),
                    (isDark ? AppColors.backgroundDark : AppColors.background)
                        .withValues(alpha: isDark ? 0.9 : 1.0),
                  ],
                ),
              ),
            ),
          ),
        ),
        // 📳 The Floating Nav Bar
        SafeArea(
          bottom: true,
          child: Container(
            height: 100,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
            alignment: Alignment.bottomCenter,
            color: Colors.transparent,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(40), // More rounded ends
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  height: 56,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 2,
                  ), // Added for corner breathing room
                  decoration: BoxDecoration(
                    color: Colors.transparent,
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
                          _buildAvatarNavItem(
                            context,
                            4,
                            profilePhoto,
                            'Profile',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
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
                child: AnimatedSwitcher(
                  duration: InteractionConfig.normal,
                  child: KovariIcon(
                    key: ValueKey('${iconType}_${isSelected}'),
                    svgString: svgString,
                    size: 20,
                    color: color,
                  ),
                ),
              ),
            ),
            AnimatedDefaultTextStyle(
              duration: InteractionConfig.medium,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.text(context, isMuted: true),
              ),
              child: Text(label),
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
                child: AnimatedContainer(
                  duration: InteractionConfig.normal,
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
            AnimatedDefaultTextStyle(
              duration: InteractionConfig.normal,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.text(context, isMuted: true),
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}
