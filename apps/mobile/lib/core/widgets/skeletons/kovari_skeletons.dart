import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../common/skeleton.dart';

export '../common/skeleton.dart' show Skeleton;

/// High-level skeleton widgets for the Kovari app.
/// Use these instead of manual Skeleton/Shimmer implementations for consistency.

class KovariSkeletonCard extends StatelessWidget {
  final double height;
  final double? width;
  final BorderRadius? borderRadius;

  const KovariSkeletonCard({
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

class KovariSkeletonListTile extends StatelessWidget {
  const KovariSkeletonListTile({super.key});

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
                Skeleton(
                  height: 16,
                  width: MediaQuery.of(context).size.width * 0.6,
                ),
                const SizedBox(height: 8),
                Skeleton(
                  height: 12,
                  width: MediaQuery.of(context).size.width * 0.4,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class KovariSkeletonTextBlock extends StatelessWidget {
  final int lines;
  const KovariSkeletonTextBlock({super.key, this.lines = 3});

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
            width: isLast
                ? MediaQuery.of(context).size.width * 0.4
                : double.infinity,
          ),
        );
      }),
    );
  }
}

class KovariSkeletonAvatar extends StatelessWidget {
  final double size;
  const KovariSkeletonAvatar({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Skeleton.circle(size: size);
  }
}

class KovariSkeletonNotificationItem extends StatelessWidget {
  const KovariSkeletonNotificationItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.borderColor(context)),
        ),
      ),
      child: Row(
        children: [
          const Skeleton.circle(size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Skeleton(width: 96, height: 12),
                    Skeleton(width: 40, height: 12),
                  ],
                ),
                const SizedBox(height: 8),
                const Skeleton(width: 128, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class KovariSkeletonUserListItem extends StatelessWidget {
  const KovariSkeletonUserListItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface(context),
        border: Border(
          bottom: BorderSide(color: AppColors.borderColor(context), width: 1),
        ),
      ),
      child: Row(
        children: [
          const Skeleton.circle(size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Skeleton(width: 100, height: 12),
                const SizedBox(height: 8),
                const Skeleton(width: 60, height: 12),
              ],
            ),
          ),
          const Spacer(),
          const Skeleton(width: 80, height: 32),
        ],
      ),
    );
  }
}

class KovariSkeletonRequestCard extends StatelessWidget {
  const KovariSkeletonRequestCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 185,
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface(context, level: 1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderColor(context)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          children: [
            Row(
              children: [
                const Skeleton.circle(size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Skeleton(width: 100, height: 12),
                      SizedBox(height: 8),
                      Skeleton(width: 60, height: 12),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Skeleton(width: 100, height: 12),
                SizedBox(height: 8),
                Skeleton(width: double.infinity, height: 12),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: Skeleton(
                    height: 36,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Skeleton(
                    height: 36,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class KovariSkeletonRequestListItem extends StatelessWidget {
  const KovariSkeletonRequestListItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 10,
      ),
      child: Row(
        children: [
          const Skeleton.circle(size: 40),
          const SizedBox(width: AppSpacing.sm * 1.5),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Skeleton(width: 96, height: 12),
                SizedBox(height: 4),
                Skeleton(width: 64, height: 12),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          const Skeleton(width: 64, height: 28),
        ],
      ),
    );
  }
}

class KovariSkeletonGroupCard extends StatelessWidget {
  final double height;
  const KovariSkeletonGroupCard({super.key, this.height = 160});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: AppColors.surface(context, level: 1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.borderColor(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          KovariSkeletonCard(
            height: height,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Skeleton(width: 140, height: 16),
                const SizedBox(height: 8),
                const Skeleton(width: 100, height: 12),
                const SizedBox(height: 16),
                Row(
                  children: const [
                    Skeleton.circle(size: 24),
                    SizedBox(width: 8),
                    Skeleton(width: 80, height: 12),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class KovariSkeletonGroupListItem extends StatelessWidget {
  const KovariSkeletonGroupListItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 12,
      ),
      child: Row(
        children: [
          const Skeleton.circle(size: 40),
          const SizedBox(width: AppSpacing.sm * 1.5),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Skeleton(width: 96, height: 12),
                    Skeleton(width: 48, height: 12),
                  ],
                ),
                const SizedBox(height: 6),
                const Skeleton(width: 64, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
