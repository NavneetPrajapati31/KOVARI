import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:shimmer/shimmer.dart';

class Skeleton extends StatelessWidget {

  const Skeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = const BorderRadius.all(Radius.circular(12)),
    this.shape = BoxShape.rectangle,
  });

  const Skeleton.circle({super.key, double? size})
    : width = size,
      height = size,
      borderRadius = null,
      shape = BoxShape.circle;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final BoxShape shape;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final baseColor = isDark
        ? AppColors.mutedDark
        : AppColors.border.withValues(alpha: 1);
    final highlightColor = isDark
        ? AppColors.mutedDark.withValues(alpha: 0.15)
        : AppColors.secondary.withValues(alpha: 1);

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        width: width,
        height: height,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: shape == BoxShape.circle
              ? null
              : (borderRadius ?? BorderRadius.circular(12)),
          shape: shape,
        ),
      ),
    );
  }
}
