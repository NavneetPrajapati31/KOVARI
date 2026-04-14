import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../providers/explore_provider.dart';

import '../../../features/groups/models/group.dart';

class GroupMatchCard extends ConsumerWidget {
  final GroupModel group;

  const GroupMatchCard({super.key, required this.group});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String name = group.name;
    final String? description = group.description;
    final String? coverImage = group.coverImage;
    final int memberCount = group.memberCount;
    final GroupCreator? creator = group.creator;

    final DateTime? startDate = group.dateRange.start != null
        ? DateTime.tryParse(group.dateRange.start!)
        : null;
    final DateTime? endDate = group.dateRange.end != null
        ? DateTime.tryParse(group.dateRange.end!)
        : null;
    final String dateRange = startDate != null && endDate != null
        ? "${DateFormat('MMM d').format(startDate)} - ${DateFormat('MMM d, yyyy').format(endDate)}"
        : "Dates TBD";
    final int? tripLength = startDate != null && endDate != null
        ? endDate.difference(startDate).inDays + 1
        : null;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Mobile Header Section
                  Padding(
                    padding: const EdgeInsets.only(
                      left: 20,
                      right: 20,
                      top: 12,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AspectRatio(
                          aspectRatio: 1 / 1,
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: coverImage != null
                                ? Image.network(
                                    coverImage,
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) => Center(
                                          child: Icon(
                                            Icons.group_outlined,
                                            size: 48,
                                            color: AppColors.mutedForeground
                                                .withValues(alpha: 0.5),
                                          ),
                                        ),
                                  )
                                : Center(
                                    child: Icon(
                                      Icons.group_outlined,
                                      size: 40,
                                      color: AppColors.mutedForeground
                                          .withValues(alpha: 0.5),
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(name, style: AppTextStyles.h3),
                        if (description != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            description,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                          ),
                        ] else ...[
                          const SizedBox(height: 8),
                          Text(
                            'No description provided.',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.mutedForeground,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                  const Divider(
                    indent: 20,
                    endIndent: 20,
                    color: AppColors.border,
                  ),

                  // Content Sections
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionTitle('Trip Details'),
                        _buildPillList([
                          _PillData(
                            icon: Icons.location_on_outlined,
                            label: group.destination.split(',')[0],
                          ),
                          _PillData(
                            icon: Icons.calendar_today_outlined,
                            label: dateRange,
                          ),
                          if (tripLength != null)
                            _PillData(
                              icon: Icons.timelapse_outlined,
                              label: "$tripLength days",
                            ),
                          if (group.budget != null)
                            _PillData(
                              icon: Icons.currency_rupee,
                              label: "${group.budget} per person",
                            ),
                        ]),
                        const SizedBox(height: 24),

                        _buildSectionTitle('About'),
                        _buildPillList([
                          if (creator != null)
                            _PillData(
                              icon: Icons.person_pin_outlined,
                              label: "By ${creator.name}",
                            ),
                          _PillData(
                            icon: Icons.group_outlined,
                            label: "$memberCount members",
                          ),
                        ]),
                        const SizedBox(height: 24),

                        if (group.tags != null && group.tags!.isNotEmpty) ...[
                          _buildSectionTitle('Group Interests'),
                          _buildPillList(
                            group.tags!
                                .map((i) => _PillData(label: i.toString()))
                                .toList(),
                          ),
                          const SizedBox(height: 24),
                        ],

                        if (group.languages != null &&
                            group.languages!.isNotEmpty) ...[
                          _buildSectionTitle('Languages'),
                          _buildPillList(
                            group.languages!
                                .map(
                                  (i) => _PillData(
                                    icon: Icons.translate_outlined,
                                    label: i.toString(),
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: 24),
                        ],

                        _buildSectionTitle('Lifestyle'),
                        _buildPillList([
                          if (group.smokingPolicy != null)
                            _PillData(
                              icon: Icons.smoking_rooms_outlined,
                              label: "Smoking: ${group.smokingPolicy}",
                            ),
                          if (group.drinkingPolicy != null)
                            _PillData(
                              icon: Icons.local_bar_outlined,
                              label: "Drinking: ${group.drinkingPolicy}",
                            ),
                        ]),
                      ],
                    ),
                  ),
                  const Divider(
                    indent: 20,
                    endIndent: 20,
                    color: AppColors.border,
                  ),
                  _buildActions(ref, group.id),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title.toUpperCase(),
        style: AppTextStyles.bodySmall.copyWith(
          fontWeight: FontWeight.bold,
          color: AppColors.mutedForeground,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildPillList(List<_PillData> pills) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: pills.map((pill) => _buildPill(pill)).toList(),
    );
  }

  Widget _buildPill(_PillData data) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (data.icon != null) ...[
            Icon(data.icon, size: 16, color: AppColors.foreground),
            const SizedBox(width: 8),
          ],
          Text(
            data.label,
            style: AppTextStyles.bodySmall.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.foreground,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(WidgetRef ref, String groupId) {
    return Container(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20, top: 20),
      child: Row(
        children: [
          Expanded(
            child: SecondaryButton(
              onPressed: () =>
                  ref.read(exploreProvider.notifier).handlePass(groupId),
              icon: Icons.close_rounded,
              height: 44,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SecondaryButton(
              onPressed: () => {}, // TODO: Implement report dialog
              icon: Icons.flag_outlined,
              height: 44,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: PrimaryButton(
              onPressed: () =>
                  ref.read(exploreProvider.notifier).handleInterested(groupId),
              icon: Icons.check_rounded,
              height: 44,
            ),
          ),
        ],
      ),
    );
  }
}

class _PillData {
  final IconData? icon;
  final String label;

  _PillData({this.icon, required this.label});
}
