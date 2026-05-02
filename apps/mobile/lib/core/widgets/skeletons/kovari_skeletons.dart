import 'package:flutter/material.dart';
import '../common/skeleton.dart';
import '../../theme/app_spacing.dart';

class SkeletonCard extends StatelessWidget {
  final double height;
  final double? width;
  final BorderRadius? borderRadius;

  const SkeletonCard({
    super.key,
    this.height = 200,
    this.width,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Skeleton(
      height: height,
      width: width ?? double.infinity,
      borderRadius: borderRadius ?? BorderRadius.circular(16),
    );
  }
}

class SkeletonListTile extends StatelessWidget {
  const SkeletonListTile({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        children: [
          const Skeleton.circle(size: 48),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(height: 16, width: MediaQuery.of(context).size.width * 0.6),
                const SizedBox(height: 8),
                Skeleton(height: 12, width: MediaQuery.of(context).size.width * 0.4),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SkeletonTextBlock extends StatelessWidget {
  final int lines;
  const SkeletonTextBlock({super.key, this.lines = 3});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(lines, (index) {
        final isLast = index == lines - 1;
        return Padding(
          padding: EdgeInsets.only(bottom: isLast ? 0 : 8),
          child: Skeleton(
            height: 14,
            width: isLast ? MediaQuery.of(context).size.width * 0.4 : double.infinity,
          ),
        );
      }),
    );
  }
}

class SkeletonAvatar extends StatelessWidget {
  final double size;
  const SkeletonAvatar({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Skeleton.circle(size: size);
  }
}
