import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'skeleton.dart';
import '../../../core/theme/motion_tokens.dart';
import '../../../core/theme/app_colors.dart';

class KovariImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Duration? fadeInDuration;
  final Duration fadeOutDuration;

  const KovariImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.fadeInDuration,
    this.fadeOutDuration = Duration.zero,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fadeIn = fadeInDuration ?? MotionTokens.fast;

    if (imageUrl.isEmpty) {
      return Skeleton(width: width, height: height, borderRadius: borderRadius);
    }

    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: CachedNetworkImage(
        key: key,
        imageUrl: imageUrl,
        cacheKey: imageUrl,
        fit: fit,
        width: width,
        height: height,
        memCacheWidth: 800, // Optimized for high-res
        placeholder: (context, url) =>
            placeholder ??
            Skeleton(width: width, height: height, borderRadius: borderRadius),
        errorWidget: (context, url, error) => Container(
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
        ),
        useOldImageOnUrlChange: true,
        fadeOutDuration: fadeOutDuration,
        fadeInDuration: fadeIn,
      ),
    );
  }
}
