import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../providers/explore_provider.dart';

class SoloMatchCard extends ConsumerWidget {
  final Map<String, dynamic> match;

  const SoloMatchCard({super.key, required this.match});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = match['user'] ?? {};
    final String name = user['full_name'] ?? user['name'] ?? 'Traveler';
    final int? age = user['age'];
    final String? avatar = user['avatar'];
    final String? bio = user['bio'];
    
    final DateTime startDate = DateTime.parse(match['start_date'].toString());
    final DateTime endDate = DateTime.parse(match['end_date'].toString());
    final String dateRange = "${DateFormat('MMM d').format(startDate)} - ${DateFormat('MMM d, yyyy').format(endDate)}";
    final int tripLength = endDate.difference(startDate).inDays + 1;

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
                        imageUrl: avatar,
                        size: 80,
                        fullName: name,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              age != null ? "$name, $age" : name,
                              style: AppTextStyles.h3,
                            ),
                            if (bio != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                bio,
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
                    _PillData(icon: Icons.map, label: match['destination'].toString().split(',')[0]),
                    _PillData(icon: Icons.calendar_today, label: dateRange),
                    _PillData(icon: Icons.timelapse, label: "$tripLength days"),
                    _PillData(icon: Icons.currency_rupee, label: match['budget'].toString()),
                  ]),
                  const SizedBox(height: 24),
                  _buildSectionTitle('About Me'),
                  _buildPillList([
                    if (user['gender'] != null) _PillData(icon: Icons.person_outline, label: user['gender']),
                    if (user['nationality'] != null) _PillData(icon: Icons.public, label: user['nationality']),
                    if (user['profession'] != null) _PillData(icon: Icons.work_outline, label: user['profession']),
                    if (user['personality'] != null) _PillData(icon: Icons.psychology_outlined, label: user['personality']),
                    if (user['religion'] != null) _PillData(icon: Icons.auto_stories_outlined, label: user['religion']),
                  ]),
                  const SizedBox(height: 24),
                  if (user['interests'] != null && (user['interests'] as List).isNotEmpty) ...[
                    _buildSectionTitle('Interests'),
                    _buildPillList((user['interests'] as List).map((i) => _PillData(label: i.toString())).toList()),
                    const SizedBox(height: 24),
                  ],
                  _buildSectionTitle('Lifestyle'),
                  _buildPillList([
                    if (user['foodPreference'] != null) _PillData(icon: Icons.restaurant, label: user['foodPreference']),
                    if (user['smoking'] != null) _PillData(icon: Icons.smoking_rooms, label: "Smoking: ${user['smoking']}"),
                    if (user['drinking'] != null) _PillData(icon: Icons.local_bar, label: "Drinking: ${user['drinking']}"),
                  ]),
                ],
              ),
            ),
          ),
          _buildActions(ref, user['userId'] ?? ''),
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

  Widget _buildActions(WidgetRef ref, String userId) {
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
              onPressed: () => ref.read(exploreProvider.notifier).handlePass(userId),
              icon: Icons.close,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: PrimaryButton(
              text: 'Interested',
              onPressed: () => ref.read(exploreProvider.notifier).handleInterested(userId),
              icon: Icons.favorite_border,
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
