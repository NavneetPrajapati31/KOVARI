import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_colors.dart';

class Skeleton extends StatelessWidget {
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final BoxShape shape;

  const Skeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = const BorderRadius.all(Radius.circular(4)),
    this.shape = BoxShape.rectangle,
  });

  const Skeleton.circle({super.key, double? size})
    : width = size,
      height = size,
      borderRadius = null,
      shape = BoxShape.circle;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final baseColor = isDark 
        ? AppColors.mutedDark.withValues(alpha: 0.5)
        : AppColors.muted.withValues(alpha: 0.5);
    final highlightColor = isDark
        ? AppColors.mutedDark.withValues(alpha: 0.2)
        : AppColors.muted.withValues(alpha: 0.2);

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      period: const Duration(milliseconds: 2000),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: shape == BoxShape.circle
              ? null
              : (borderRadius ?? BorderRadius.circular(4)),
          shape: shape,
        ),
      ),
    );
  }
}
