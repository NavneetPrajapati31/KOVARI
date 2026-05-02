import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/common/skeleton.dart';
import '../../../../shared/widgets/kovari_avatar.dart';

class MockGroup {
  final String id;
  final String name;
  final String destination;
  final int members;
  final String? imageUrl;

  MockGroup({
    required this.id,
    required this.name,
    required this.destination,
    required this.members,
    this.imageUrl,
  });
}

class GroupsSection extends StatelessWidget {
  final List<MockGroup> groups;
  final bool isLoading;

  const GroupsSection({
    super.key,
    required this.groups,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
        borderRadius: AppRadius.large,
      ),
      child: ClipRRect(
        borderRadius: AppRadius.large,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Travel Groups',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Manage your collaborative travel experiences',
                    style: AppTextStyles.label.copyWith(
                      fontSize: 12,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),

            if (isLoading)
              _buildSkeleton()
            else if (groups.isEmpty)
              _buildEmptyState()
            else
              Column(
                children: [
                  for (int i = 0; i < groups.length; i++) ...[
                    _GroupCard(group: groups[i]),
                    if (i < groups.length - 1)
                      const Divider(
                        height: 1,
                        color: AppColors.border,
                        indent: 0,
                        endIndent: 0,
                      ),
                  ],
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkeleton() {
    return Column(
      children: List.generate(
        7,
        (i) => Column(
          children: [
            _GroupCardSkeleton(),
            if (i < 6) const Divider(height: 1, color: AppColors.border),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      child: Center(
        child: Column(
          children: [
            Text(
              'No joined groups',
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Create or join a group to get started',
              style: AppTextStyles.label.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupCard extends StatelessWidget {
  final MockGroup group;

  const _GroupCard({required this.group});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: 10,
        ),
        child: Row(
          children: [
            // Avatar
            KovariAvatar(
              imageUrl: group.imageUrl,
              size: 40,
              fullName: group.name,
            ),
            const SizedBox(width: AppSpacing.sm * 1.5),
            // Info
            Expanded(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          group.name,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.foreground,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 24),
                      Text(
                        _getCityOnly(group.destination),
                        style: AppTextStyles.bodySmall.copyWith(
                          fontWeight: FontWeight.w500,
                          color: AppColors.foreground,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 1),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        group.members == 1
                            ? '1 member'
                            : '${group.members} members',
                        style: AppTextStyles.label.copyWith(
                          fontSize: 12,
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getCityOnly(String destination) {
    if (destination.isEmpty) return '';
    return destination.split(',')[0].trim();
  }
}

class _GroupCardSkeleton extends StatelessWidget {
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
                  children: [
                    Skeleton(
                      width: 96,
                      height: 12,
                      borderRadius: AppRadius.small,
                    ),
                    Skeleton(
                      width: 48,
                      height: 12,
                      borderRadius: AppRadius.small,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Skeleton(width: 64, height: 12, borderRadius: AppRadius.small),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
