import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/providers/profile_provider.dart';
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
    final profile = ref.watch(profileProvider);
    final profilePhoto = UrlUtils.getFullImageUrl(profile?.profileImage);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: SafeArea(
        child: Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, 'home'),
              _buildNavItem(1, 'search'),
              _buildNavItem(2, 'send'),
              _buildNavItem(3, 'users'),
              _buildAvatarNavItem(4, profilePhoto),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, String iconType) {
    final isSelected = currentIndex == index;
    final color = isSelected ? AppColors.primary : Colors.black;

    String svgString = '';
    switch (iconType) {
      case 'home':
        svgString = KovariIcons.getHome(
          isFilled: isSelected,
          color: 'currentColor',
        );
      case 'search':
        // Search icon uses strokeWidth=3 instead of fill per web app code
        svgString = KovariIcons.getSearch(
          isFilled: false,
          strokeWidth: isSelected ? 3 : 2,
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
      child: InkWell(
        onTap: () => onTap(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Container(
          height: double.infinity,
          alignment: Alignment.center,
          child: KovariIcon(svgString: svgString, size: 20, color: color),
        ),
      ),
    );
  }

  Widget _buildAvatarNavItem(int index, String? profilePhoto) {
    final isSelected = currentIndex == index;

    return Expanded(
      child: InkWell(
        onTap: () => onTap(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Container(
          height: double.infinity,
          alignment: Alignment.center,
          child: Container(
            padding: const EdgeInsets.all(2.0),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? AppColors.primary : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: KovariAvatar(
              imageUrl: profilePhoto,
              size: 26,
              isSelected: isSelected,
            ),
          ),
        ),
      ),
    );
  }
}
