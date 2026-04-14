import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/url_utils.dart';
import '../../../shared/widgets/primary_button.dart';
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

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Image Section
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: AspectRatio(
              aspectRatio: 2,
              child: coverImageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: coverImageUrl,
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                      placeholder: (context, url) =>
                          Container(color: AppColors.secondary),
                      errorWidget: (context, url, error) =>
                          _buildImagePlaceholder(),
                    )
                  : _buildImagePlaceholder(),
            ),
          ),

          // Content Section
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Group Name
                Text(
                  group.name,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.foreground,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),

                // Date and Destination Row
                Row(
                  children: [
                    const Icon(
                      LucideIcons.calendar,
                      size: 14,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      flex: 4,
                      child: Text(
                        _formatDateRange(),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6.0),
                      child: Text(
                        '|',
                        style: TextStyle(
                          color: AppColors.mutedForeground,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const Icon(
                      LucideIcons.mapPin,
                      size: 14,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      flex: 2,
                      child: Text(
                        _formatDestinationCity(group.destination),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Member Count and Creator
                Row(
                  children: [
                    Flexible(
                      flex: 2,
                      child: Text(
                        _formatMemberCount(),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6.0),
                      child: Text(
                        '|',
                        style: TextStyle(
                          color: AppColors.mutedForeground,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    Flexible(
                      flex: 3,
                      child: Text(
                        "Created by @${group.creator.username}",
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Action Button
                PrimaryButton(
                  text: "View Group",
                  onPressed: onAction,
                  height: 36,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      color: AppColors.secondary,
      child: const Center(
        child: Icon(LucideIcons.users, color: AppColors.muted, size: 32),
      ),
    );
  }
}
