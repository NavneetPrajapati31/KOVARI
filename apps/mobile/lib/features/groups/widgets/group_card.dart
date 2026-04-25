import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
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

  String _formatDateRange() {
    if (group.dateRange.isOngoing) return "Ongoing";
    if (group.dateRange.start == null) return "Dates not available";

    final startDate = DateTime.parse(group.dateRange.start!);
    final startStr = DateFormat('MMM d, yyyy').format(startDate);

    if (group.dateRange.end == null) return startStr;

    final endDate = DateTime.parse(group.dateRange.end!);
    final endStr = DateFormat('MMM d, yyyy').format(endDate);

    return "$startStr - $endStr";
  }

  String _formatMemberCount() {
    if (group.memberCount == 0) return "No members yet";
    if (group.memberCount == 1) return "1 member";
    if (group.memberCount > 99) return "99+ members";
    return "${group.memberCount} members";
  }

  String _formatDestinationCity(String destination) {
    final trimmed = destination.trim();
    if (trimmed.isEmpty) return trimmed;
    final city = trimmed.split(",")[0].trim();
    return city;
  }

  @override
  Widget build(BuildContext context) {
    final coverImageUrl = UrlUtils.getFullImageUrl(group.coverImage);

    return InkWell(
      onTap: onAction,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: 10,
        ),
        child: Row(
          children: [
            // Avatar
            KovariAvatar(
              imageUrl: coverImageUrl,
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
                        _formatDestinationCity(group.destination),
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
                        group.memberCount == 1
                            ? '1 member'
                            : '${group.memberCount} members',
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
}
