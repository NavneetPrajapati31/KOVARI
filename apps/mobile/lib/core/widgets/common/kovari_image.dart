import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/motion_tokens.dart';
import 'package:mobile/core/widgets/common/skeleton.dart';

class KovariImage extends StatelessWidget {

  const KovariImage({
    super.key,
    required this.imageUrl,
    this.thumbnailUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.fadeInDuration,
    this.fadeOutDuration = Duration.zero,
  });
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Duration? fadeInDuration;
  final Duration fadeOutDuration;

  final String? thumbnailUrl;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fadeIn = fadeInDuration ?? MotionTokens.fast;

    if (imageUrl.isEmpty) {
      return Skeleton(width: width, height: height, borderRadius: borderRadius);
    }

    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: SizedBox(
        width: width,
        height: height,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // 1. Thumbnail / Placeholder Layer
            if (thumbnailUrl != null)
              CachedNetworkImage(
                imageUrl: thumbnailUrl!,
                fit: fit,
                memCacheWidth: 200,
                placeholder: (context, url) =>
                    placeholder ??
                    Skeleton(
                      width: width,
                      height: height,
                      borderRadius: borderRadius,
                    ),
              ),

            // 2. Main High-Res Image
            CachedNetworkImage(
              imageUrl: imageUrl,
              cacheKey: imageUrl,
              fit: fit,
              memCacheWidth: 800,
              placeholder: (context, url) => thumbnailUrl == null
                  ? (placeholder ??
                      Skeleton(
                        width: width,
                        height: height,
                        borderRadius: borderRadius,
                      ))
                  : const SizedBox.shrink(),
              errorWidget: (context, url, error) => _buildErrorWidget(isDark),
              useOldImageOnUrlChange: true,
              fadeOutDuration: fadeOutDuration,
              fadeInDuration: fadeIn,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget(bool isDark) => Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isDark ? AppColors.mutedDark : AppColors.muted,
      ),
      child: Icon(
        Icons.image_not_supported_outlined,
        color: isDark ? AppColors.mutedForegroundDark : AppColors.mutedForeground,
        size: 20,
      ),
    );
}
