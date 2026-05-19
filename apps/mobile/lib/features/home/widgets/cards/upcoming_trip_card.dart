import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/services/haptic_service.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_radius.dart';
import 'package:mobile/core/theme/app_spacing.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/widgets/common/kovari_image.dart';
import 'package:mobile/core/widgets/skeletons/kovari_skeletons.dart';
import 'package:mobile/shared/widgets/app_card.dart';

class UpcomingTripCard extends StatelessWidget {

  const UpcomingTripCard({
    super.key,
    required this.name,
    this.groupId,
    this.imageUrl,
    this.onExplore,
    this.isLoading = false,
  });
  final String name;
  final String? imageUrl;
  final String? groupId;
  final VoidCallback? onExplore;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    if (isLoading) return _buildSkeleton();
    if (name.isEmpty || groupId == null) return _buildEmptyState(context);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasImage = imageUrl != null && imageUrl!.trim().isNotEmpty;

    return AppCard(
      height: 180,
      padding: EdgeInsets.zero,
      child: Stack(
        children: [
          Positioned.fill(
            child: hasImage
                ? KovariImage(
                    imageUrl: imageUrl!,
                    borderRadius: AppRadius.large,
                  )
                : Container(
                    color: isDark ? AppColors.mutedDark : AppColors.secondary,
                    child: Center(
                      child: Icon(
                        LucideIcons.calendarClock,
                        size: 40,
                        color:
                            (isDark
                                    ? AppColors.mutedForegroundDark
                                    : AppColors.mutedForeground)
                                .withValues(alpha: 0.5),
                      ),
                    ),
                  ),
          ),
          Positioned(
            bottom: AppSpacing.sm,
            left: AppSpacing.sm,
            right: AppSpacing.sm,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: _buildGlassContainer(
                    context,
                    child: Text(
                      name,
                      style: AppTextStyles.label.copyWith(
                        color: hasImage
                            ? Colors.white
                            : AppColors.text(context),
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                GestureDetector(
                  onTap: () {
                    HapticService.selection();
                    onExplore?.call();
                  },
                  child: _buildGlassContainer(
                    context,
                    borderRadius: BorderRadius.circular(100),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Upcoming',
                          style: AppTextStyles.label.copyWith(
                            color: hasImage
                                ? Colors.white
                                : AppColors.text(context),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          LucideIcons.calendarClock,
                          size: 14,
                          color: hasImage
                              ? Colors.white
                              : AppColors.text(context),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassContainer(
    BuildContext context, {
    required Widget child,
    BorderRadius? borderRadius,
  }) {
    final effectiveRadius = borderRadius ?? BorderRadius.circular(24);
    return ClipRRect(
      borderRadius: effectiveRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.mds,
            vertical: 6,
          ),
          height: 32,
          decoration: BoxDecoration(
            color:
                (Theme.of(context).brightness == Brightness.dark
                        ? Colors.white
                        : Colors.black)
                    .withValues(alpha: 0.05),
            border: Border.all(
              color:
                  (Theme.of(context).brightness == Brightness.dark
                          ? Colors.white
                          : Colors.black)
                      .withValues(alpha: 0.1),
              width: 0.5,
            ),
            borderRadius: effectiveRadius,
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildSkeleton() => const KovariSkeletonCard(
      height: 180,
      borderRadius: AppRadius.large,
    );

  Widget _buildEmptyState(BuildContext context) => AppCard(
      height: 180,
      interactive: false,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            LucideIcons.calendar,
            size: 20,
            color: AppColors.text(context, isMuted: true),
          ),
          const SizedBox(height: 8),
          Text(
            'No upcoming trip',
            style: AppTextStyles.label.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.text(context, isMuted: true),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Join or create a group to see your next trip',
            textAlign: TextAlign.center,
            style: AppTextStyles.label.copyWith(
              color: AppColors.text(context, isMuted: true),
            ),
          ),
        ],
      ),
    );
}
