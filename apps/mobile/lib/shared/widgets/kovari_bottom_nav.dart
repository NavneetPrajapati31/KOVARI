import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/providers/profile_provider.dart';
import '../utils/kovari_icons.dart';

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
    final profilePhoto = profile?['profile_photo'] as String?;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.withValues(alpha: 0.15), width: 1),
        ),
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
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                // Web app uses ring-2 and ring-offset-2 which is a bold border
                color: isSelected ? AppColors.primary : Colors.transparent,
                width: 2.0,
              ),
              image: profilePhoto != null
                  ? DecorationImage(
                      image: NetworkImage(profilePhoto),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: profilePhoto == null
                ? Icon(
                    isSelected
                        ? CupertinoIcons.person_fill
                        : CupertinoIcons.person,
                    size: 20,
                    color: isSelected ? AppColors.primary : Colors.black,
                  )
                : null,
          ),
        ),
      ),
    );
  }
}
