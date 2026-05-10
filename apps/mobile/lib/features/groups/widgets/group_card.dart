import 'package:flutter/material.dart';
import 'package:mobile/core/config/interaction_config.dart';
import 'package:mobile/shared/widgets/interactive_wrapper.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/url_utils.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../models/group.dart';

class GroupCard extends StatelessWidget {
  final GroupModel group;
  final VoidCallback? onAction;

  const GroupCard({super.key, required this.group, this.onAction});

  String _formatDestinationCity(String destination) {
    final trimmed = destination.trim();
    if (trimmed.isEmpty) return trimmed;
    final city = trimmed.split(",")[0].trim();
    return city;
  }

  @override
  Widget build(BuildContext context) {
    final coverImageUrl = UrlUtils.getFullImageUrl(group.coverImage);

    return InteractiveWrapper(
      onPressed: onAction,
      hapticType: HapticType.selection,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            // Avatar
            KovariAvatar(
              imageUrl: coverImageUrl,
              size: 42,
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
                            color: AppColors.text(context),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 24),
                      Text(
                        _formatDestinationCity(group.destination),
                        style: AppTextStyles.bodySmall.copyWith(
                          fontWeight: FontWeight.w500,
                          color: AppColors.text(context, isMuted: true),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        group.memberCount == 1
                            ? '1 member'
                            : '${group.memberCount} members',
                        style: AppTextStyles.label.copyWith(
                          fontSize: 12,
                          color: AppColors.text(context, isMuted: true),
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
}
