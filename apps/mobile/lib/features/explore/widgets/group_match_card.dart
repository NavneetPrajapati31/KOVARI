import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../providers/explore_provider.dart';

class GroupMatchCard extends ConsumerWidget {
  final Map<String, dynamic> group;

  const GroupMatchCard({super.key, required this.group});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String name = group['name'] ?? 'Travel Group';
    final String? description = group['description'];
    final String? coverImage = group['cover_image'];
    final int memberCount = group['memberCount'] ?? 0;
    final Map<String, dynamic>? creator = group['creator'];

    final DateTime? startDate = group['startDate'] != null ? DateTime.parse(group['startDate'].toString()) : null;
    final DateTime? endDate = group['endDate'] != null ? DateTime.parse(group['endDate'].toString()) : null;
    final String dateRange = startDate != null && endDate != null
        ? "${DateFormat('MMM d').format(startDate)} - ${DateFormat('MMM d, yyyy').format(endDate)}"
        : "Dates TBD";
    final int? tripLength = startDate != null && endDate != null ? endDate.difference(startDate).inDays + 1 : null;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      KovariAvatar(
                        imageUrl: coverImage,
                        size: 80,
                        fullName: name,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: AppTextStyles.h3),
                            if (description != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                description,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 48),
                  _buildSectionTitle('Trip Details'),
                  _buildPillList([
                    _PillData(icon: Icons.map, label: group['destination'].toString().split(',')[0]),
                    _PillData(icon: Icons.calendar_today, label: dateRange),
                    if (tripLength != null) _PillData(icon: Icons.timelapse, label: "$tripLength days"),
                    if (group['budget'] != null) _PillData(icon: Icons.currency_rupee, label: "${group['budget']} per person"),
                  ]),
                  const SizedBox(height: 24),
                  _buildSectionTitle('About'),
                  _buildPillList([
                    if (creator != null) _PillData(icon: Icons.person, label: "Created by ${creator['name']}"),
                    _PillData(icon: Icons.group, label: "$memberCount members"),
                  ]),
                  const SizedBox(height: 24),
                  if (group['tags'] != null && (group['tags'] as List).isNotEmpty) ...[
                    _buildSectionTitle('Group Interests'),
                    _buildPillList((group['tags'] as List).map((i) => _PillData(label: i.toString())).toList()),
                    const SizedBox(height: 24),
                  ],
                  if (group['languages'] != null && (group['languages'] as List).isNotEmpty) ...[
                    _buildSectionTitle('Languages'),
                    _buildPillList((group['languages'] as List).map((i) => _PillData(icon: Icons.translate, label: i.toString())).toList()),
                    const SizedBox(height: 24),
                  ],
                  _buildSectionTitle('Lifestyle'),
                  _buildPillList([
                    if (group['smokingPolicy'] != null) _PillData(icon: Icons.smoking_rooms, label: "Smoking: ${group['smokingPolicy']}"),
                    if (group['drinkingPolicy'] != null) _PillData(icon: Icons.local_bar, label: "Drinking: ${group['drinkingPolicy']}"),
                  ]),
                ],
              ),
            ),
          ),
          _buildActions(ref, group['id'] ?? ''),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (data.icon != null) ...[
            Icon(data.icon, size: 14, color: AppColors.mutedForeground),
            const SizedBox(width: 6),
          ],
          Text(
            data.label,
            style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(WidgetRef ref, String groupId) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: SecondaryButton(
              text: 'Skip',
              onPressed: () => ref.read(exploreProvider.notifier).handlePass(groupId),
              icon: Icons.close,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: PrimaryButton(
              text: 'Join Group',
              onPressed: () => ref.read(exploreProvider.notifier).handleInterested(groupId),
              icon: Icons.group_add_outlined,
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
