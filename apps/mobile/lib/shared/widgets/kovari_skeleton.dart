import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';

class KovariSkeleton extends StatelessWidget {
  final double? width;
  final double? height;
  final double borderRadius;
  final BoxShape shape;

  const KovariSkeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 12.0,
    this.shape = BoxShape.rectangle,
  });

  const KovariSkeleton.circle({
    super.key,
    double? size,
  })  : width = size,
        height = size,
        borderRadius = 0,
        shape = BoxShape.circle;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Shimmer.fromColors(
      baseColor: isDark 
          ? AppColors.mutedDark.withValues(alpha: 0.5)
          : AppColors.muted.withValues(alpha: 0.8),
      highlightColor: isDark 
          ? AppColors.mutedDark.withValues(alpha: 0.2)
          : Colors.white.withValues(alpha: 0.4),
      period: const Duration(milliseconds: 1500),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: shape == BoxShape.circle 
              ? null 
              : BorderRadius.circular(borderRadius),
          shape: shape,
        ),
      ),
    );
  }
}
