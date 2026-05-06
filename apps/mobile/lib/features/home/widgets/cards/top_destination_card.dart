import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/common/skeleton.dart';
import '../../../../core/widgets/common/kovari_image.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../core/theme/hero_tokens.dart';

class TopDestinationCard extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback? onExplore;
  final bool isLoading;

  const TopDestinationCard({
    super.key,
    required this.name,
    this.imageUrl,
    this.onExplore,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) return _buildSkeleton();
    if (name.isEmpty) return _buildEmptyState(context);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasImage = imageUrl != null && imageUrl!.trim().isNotEmpty;

    return AppCard(
      height: 180,
      padding: EdgeInsets.zero,
      onTap: onExplore,
      child: Stack(
        children: [
          Positioned.fill(
            child: hasImage
                ? Hero(
                    tag: HeroTokens.destination(name),
                    child: KovariImage(
                      imageUrl: imageUrl!,
                      borderRadius: AppRadius.large,
                    ),
                  )
                : Container(
                    color: isDark ? AppColors.mutedDark : AppColors.secondary,
                    child: Center(
                      child: Icon(
                        LucideIcons.map,
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
                _buildGlassContainer(
                  context,
                  borderRadius: BorderRadius.circular(100),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Top',
                        style: AppTextStyles.label.copyWith(
                          color: hasImage
                              ? Colors.white
                              : AppColors.text(context),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        LucideIcons.arrowUp,
                        size: 14,
                        color: hasImage
                            ? Colors.white
                            : AppColors.text(context),
                      ),
                    ],
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
            color: Colors.transparent,
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

  Widget _buildSkeleton() {
    return Skeleton(
      height: 180,
      borderRadius: AppRadius.large,
      width: double.infinity,
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return AppCard(
      height: 180,
      interactive: false,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            LucideIcons.mapPin,
            size: 20,
            color: AppColors.text(context, isMuted: true),
          ),
          const SizedBox(height: 8),
          Text(
            'No top destination',
            style: AppTextStyles.label.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.text(context, isMuted: true),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Your top destination will appear here once you have trips',
            textAlign: TextAlign.center,
            style: AppTextStyles.label.copyWith(
              color: AppColors.text(context, isMuted: true),
            ),
          ),
        ],
      ),
    );
  }
}
