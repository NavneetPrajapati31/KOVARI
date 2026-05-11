import 'package:flutter/material.dart';
import 'package:mobile/shared/widgets/app_card.dart';
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
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface(context, level: 1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderColor(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Skeleton.circle(size: 40),
              const SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Skeleton(width: 100, height: 14),
                        Skeleton(width: 60, height: 11),
                      ],
                    ),
                    SizedBox(height: 4),
                    Skeleton(width: 80, height: 12),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Skeleton(width: 120, height: 10),
              SizedBox(height: 6),
              Skeleton(width: double.infinity, height: 14),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: Skeleton(
                  height: 36,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
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

class KovariSkeletonExplore extends StatelessWidget {
  const KovariSkeletonExplore({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 20, right: 20, top: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(
                  aspectRatio: 1 / 1,
                  child: Skeleton(
                    borderRadius: BorderRadius.circular(16),
                    width: double.infinity,
                    height: double.infinity,
                  ),
                ),
                const SizedBox(height: 20),
                const Skeleton(width: 180, height: 16),
                const SizedBox(height: 8),
                const Skeleton(width: double.infinity, height: 16),
                const SizedBox(height: 8),
                const Skeleton(width: 240, height: 16),
                const SizedBox(height: 16),
              ],
            ),
          ),
          Divider(
            indent: 20,
            endIndent: 20,
            color: AppColors.borderColor(context),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionSkeleton(),
                const SizedBox(height: 24),
                _buildSectionSkeleton(),
                const SizedBox(height: 24),
                _buildSectionSkeleton(),
              ],
            ),
          ),
          Divider(
            indent: 20,
            endIndent: 20,
            color: AppColors.borderColor(context),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Skeleton(
                    height: 44,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Skeleton(
                    height: 44,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Skeleton(
                    height: 44,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 110), // Bottom nav spacer
        ],
      ),
    );
  }

  Widget _buildSectionSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Skeleton(width: 100, height: 16),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            4,
            (index) => Skeleton(
              width: 90 + (index * 15.0),
              height: 26,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
      ],
    );
  }
}

class KovariSkeletonProfile extends StatelessWidget {
  const KovariSkeletonProfile({super.key});

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.md,
          topPadding + AppSpacing.sm,
          AppSpacing.md,
          AppSpacing.sm,
        ),
        child: Column(
          children: [
            // Header Card Skeleton
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Skeleton.circle(size: 65),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Skeleton(width: 120, height: 12),
                            const SizedBox(height: 8),
                            const Skeleton(width: 80, height: 12),
                            const SizedBox(height: 8),
                            const Skeleton(width: 80, height: 12),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  const Skeleton(width: double.infinity, height: 12),
                  const SizedBox(height: 6),
                  const Skeleton(width: 200, height: 12),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    children: [
                      Expanded(
                        child: Skeleton(
                          height: 32,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Skeleton(
                          height: 32,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.mds),
            // Content Card Skeleton
            AppCard(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.lg,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Skeleton(width: 40, height: 12),
                  const SizedBox(height: AppSpacing.lg),
                  _buildInfoRowSkeleton(),
                  const SizedBox(height: 16),
                  _buildInfoRowSkeleton(),
                  const SizedBox(height: 16),
                  _buildInfoRowSkeleton(),
                  const SizedBox(height: 20),
                  Divider(height: 1, color: AppColors.borderColor(context)),
                  const SizedBox(height: 20),
                  _buildInfoRowSkeleton(),
                  const SizedBox(height: 16),
                  _buildInfoRowSkeleton(),
                  const SizedBox(height: 20),
                  _buildInfoRowSkeleton(),
                  const SizedBox(height: 20),
                  Divider(height: 1, color: AppColors.borderColor(context)),
                  const SizedBox(height: 20),
                  const Skeleton(width: 80, height: 12),
                  const SizedBox(height: AppSpacing.mds),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: List.generate(
                      3,
                      (index) => Skeleton(
                        width: 90,
                        height: 24,
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 110), // Bottom nav spacer
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRowSkeleton() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Skeleton(width: 40, height: 12),
              SizedBox(height: 6),
              Skeleton(width: 80, height: 12),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Skeleton(width: 40, height: 12),
              SizedBox(height: 6),
              Skeleton(width: 80, height: 12),
            ],
          ),
        ),
      ],
    );
  }
}

class KovariSkeletonItineraryBoard extends StatelessWidget {
  const KovariSkeletonItineraryBoard({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Skeleton(width: 140, height: 20),
            const SizedBox(height: 8),
            const Skeleton(width: 240, height: 14),
            const SizedBox(height: 24),
            ...List.generate(3, (index) => _buildSectionSkeleton()),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionSkeleton() {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Row(
              children: [
                Skeleton.circle(size: 8),
                SizedBox(width: 8),
                Skeleton(width: 80, height: 14),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: List.generate(
                2,
                (index) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.grey.withValues(alpha: 0.1),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Skeleton(width: 120, height: 12),
                          Skeleton(width: 40, height: 12),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Skeleton(width: 60, height: 12),
                      const SizedBox(height: AppSpacing.mds),
                      const Skeleton(width: 120, height: 14),
                      const SizedBox(height: 8),
                      const Skeleton(width: double.infinity, height: 12),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
