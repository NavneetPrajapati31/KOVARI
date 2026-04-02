import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/common/skeleton.dart';
import '../../../../core/widgets/common/user_avatar_fallback.dart';

class MockRequest {
  final String id;
  final String name;
  final String location;
  final String? avatarUrl;

  MockRequest({
    required this.id,
    required this.name,
    required this.location,
    this.avatarUrl,
  });
}

class RequestsSection extends StatelessWidget {
  final List<MockRequest> requests;
  final bool isLoading;

  const RequestsSection({
    super.key,
    required this.requests,
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
                    'Interests',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${requests.length} pending interests',
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
            else if (requests.isEmpty)
              _buildEmptyState()
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: requests.length,
                separatorBuilder: (context, index) => const Divider(
                  height: 1,
                  color: AppColors.border,
                  indent: 0,
                  endIndent: 0,
                ),
                itemBuilder: (context, index) {
                  return _RequestCard(request: requests[index]);
                },
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
            _RequestCardSkeleton(),
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
              'No pending interests',
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'New match interests will appear here',
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

class _RequestCard extends StatelessWidget {
  final MockRequest request;

  const _RequestCard({required this.request});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 10,
      ),
      child: Row(
        children: [
          // Avatar
          request.avatarUrl != null
              ? Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    shape: BoxShape.circle,
                    image: DecorationImage(
                      image: NetworkImage(request.avatarUrl!),
                      fit: BoxFit.cover,
                    ),
                  ),
                )
              : const UserAvatarFallback(size: 40),
          const SizedBox(width: AppSpacing.sm * 1.5),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  request.name,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.foreground,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  request.location,
                  style: AppTextStyles.label.copyWith(
                    fontSize: 12,
                    color: AppColors.mutedForeground,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Actions
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildActionButton(
                label: 'Connect',
                backgroundColor: AppColors.primary,
                textColor: Colors.white,
                onTap: () {},
              ),
              const SizedBox(width: AppSpacing.sm),
              _buildSimpleIconButton(icon: LucideIcons.x, onTap: () {}),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required Color backgroundColor,
    required Color textColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: AppTextStyles.label.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: textColor,
          ),
        ),
      ),
    );
  }

  Widget _buildSimpleIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 14, color: AppColors.mutedForeground),
      ),
    );
  }
}

class _RequestCardSkeleton extends StatelessWidget {
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
              children: [
                Skeleton(width: 96, height: 12, borderRadius: AppRadius.small),
                const SizedBox(height: 4),
                Skeleton(width: 64, height: 12, borderRadius: AppRadius.small),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Skeleton(width: 64, height: 28, borderRadius: AppRadius.medium),
        ],
      ),
    );
  }
}
