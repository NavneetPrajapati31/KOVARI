import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/common/skeleton.dart';
import '../../../../core/widgets/common/kovari_image.dart';

class UpcomingTripCard extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final String? groupId;
  final VoidCallback? onExplore;
  final bool isLoading;

  const UpcomingTripCard({
    super.key,
    required this.name,
    this.groupId,
    this.imageUrl,
    this.onExplore,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _buildSkeleton();
    }

    if (name.isEmpty || groupId == null) {
      return _buildEmptyState();
    }

    final hasImage = imageUrl != null && imageUrl!.trim().isNotEmpty;

    return Container(
      height: 180,
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: AppRadius.large,
        border: Border.all(color: AppColors.border),
      ),
      child: ClipRRect(
        borderRadius: AppRadius.large,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        child: Stack(
          children: [
            // Background Image or Fallback
            Positioned.fill(
              child: hasImage
                  ? KovariImage(
                      imageUrl: imageUrl!,
                      borderRadius: AppRadius.large,
                    )
                  : Container(
                      color: AppColors.secondary,
                      child: Center(
                        child: Icon(
                          LucideIcons.calendarClock,
                          size: 40,
                          color: AppColors.mutedForeground.withValues(
                            alpha: 0.5,
                          ),
                        ),
                      ),
                    ),
            ),

            // Bottom Controls (Glassmorphism)
            Positioned(
              bottom: AppSpacing.sm,
              left: AppSpacing.sm,
              right: AppSpacing.sm,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Location Name Label
                  Flexible(
                    child: _buildGlassContainer(
                      child: Text(
                        name,
                        style: AppTextStyles.label.copyWith(
                          color: hasImage
                              ? Colors.white
                              : AppColors.mutedForeground,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  // Action Button
                  GestureDetector(
                    onTap: onExplore,
                    child: _buildGlassContainer(
                      borderRadius: BorderRadius.circular(100),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Upcoming',
                            style: AppTextStyles.label.copyWith(
                              color: hasImage
                                  ? Colors.white
                                  : AppColors.mutedForeground,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            LucideIcons.calendarClock,
                            size: 14,
                            color: hasImage
                                ? Colors.white
                                : AppColors.mutedForeground,
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
      ),
    );
  }

  Widget _buildGlassContainer({
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
            color: Colors.white.withValues(alpha: 0.1),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 0.5,
            ),
            borderRadius: effectiveRadius,
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildSkeleton() {
    return Skeleton(
      height: 180,
      width: double.infinity,
      borderRadius: AppRadius.large,
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: 180,
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
        borderRadius: AppRadius.large,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            LucideIcons.calendar,
            size: 20,
            color: AppColors.mutedForeground,
          ),
          const SizedBox(height: 8),
          Text(
            'No upcoming trip',
            style: AppTextStyles.label.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Join or create a group to see your next trip',
            textAlign: TextAlign.center,
            style: AppTextStyles.label.copyWith(
              color: AppColors.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}
