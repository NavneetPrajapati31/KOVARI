import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../models/match_user.dart';
import '../providers/explore_provider.dart';

class SoloMatchCard extends ConsumerWidget {
  final MatchUser match;

  const SoloMatchCard({super.key, required this.match});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Map<String, dynamic> user = Map<String, dynamic>.from(
      match.raw['user'] ?? {},
    );
    final String name = user['full_name'] ?? user['name'] ?? 'Traveler';
    final int? age = match.age > 0 ? match.age : null;
    final String? bio = user['bio'];

    final String? startStr = match.raw['start_date']?.toString();
    final String? endStr = match.raw['end_date']?.toString();
    final DateTime? startDate = startStr != null
        ? DateTime.tryParse(startStr)
        : null;
    final DateTime? endDate = endStr != null ? DateTime.tryParse(endStr) : null;

    String? dateRange;
    int? tripLength;
    if (startDate != null && endDate != null) {
      dateRange =
          "${DateFormat('MMM d').format(startDate)} - ${DateFormat('MMM d, yyyy').format(endDate)}";
      tripLength = endDate.difference(startDate).inDays + 1;
    }

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
                            child: match.image.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: match.image,
                                    fit: BoxFit.cover,
                                    placeholder: (context, url) => Container(
                                      color: AppColors.secondary,
                                      child: const Center(
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    ),
                                    errorWidget:
                                        (context, url, dynamic error) =>
                                            _buildInitialsFallback(match.name),
                                  )
                                : _buildInitialsFallback(match.name),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          age != null ? "$name, $age" : name,
                          style: AppTextStyles.h3,
                        ),

                        if (bio != null && bio.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            bio,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.mutedForeground,
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
                            label: match.location.split(',')[0],
                          ),
                          if (dateRange != null)
                            _PillData(
                              icon: Icons.calendar_today_outlined,
                              label: dateRange,
                            ),
                          if (tripLength != null)
                            _PillData(
                              icon: Icons.timelapse_outlined,
                              label: "$tripLength days",
                            ),
                          if (match.raw['budget'] != null)
                            _PillData(
                              icon: Icons.currency_rupee,
                              label: match.raw['budget'].toString(),
                            ),
                        ]),
                        const SizedBox(height: 24),

                        _buildSectionTitle('About Me'),
                        _buildPillList([
                          if (user['gender'] != null)
                            _PillData(
                              icon: Icons.person_outline,
                              label: user['gender'],
                            ),
                          if (user['nationality'] != null)
                            _PillData(
                              icon: Icons.public_outlined,
                              label: user['nationality'],
                            ),
                          if (user['profession'] != null)
                            _PillData(
                              icon: Icons.work_outline,
                              label: user['profession'],
                            ),
                          if (user['personality'] != null)
                            _PillData(
                              icon:
                                  user['personality']
                                          .toString()
                                          .toLowerCase() ==
                                      'extrovert'
                                  ? Icons.bolt
                                  : user['personality']
                                            .toString()
                                            .toLowerCase() ==
                                        'introvert'
                                  ? Icons.menu_book_outlined
                                  : Icons.adjust,
                              label: user['personality'],
                            ),
                          if (user['religion'] != null)
                            _PillData(
                              icon: Icons.auto_stories_outlined,
                              label: user['religion'],
                            ),
                        ]),
                        const SizedBox(height: 24),

                        if (user['interests'] != null &&
                            user['interests'] is List &&
                            (user['interests'] as List).isNotEmpty) ...[
                          _buildSectionTitle('Interests'),
                          _buildPillList(
                            (user['interests'] as List)
                                .map((i) => _PillData(label: i.toString()))
                                .toList(),
                          ),
                          const SizedBox(height: 24),
                        ],

                        _buildSectionTitle('Lifestyle'),
                        _buildPillList([
                          if (user['foodPreference'] != null)
                            _PillData(
                              icon: Icons.restaurant_outlined,
                              label: user['foodPreference'],
                            ),
                          if (user['smoking'] != null)
                            _PillData(
                              icon: Icons.smoking_rooms_outlined,
                              label: "Smoking: ${user['smoking']}",
                            ),
                          if (user['drinking'] != null)
                            _PillData(
                              icon: Icons.local_bar_outlined,
                              label: "Drinking: ${user['drinking']}",
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
                  _buildActions(ref, match.id),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInitialsFallback(String name) {
    if (name.isEmpty) name = '?';
    final initial = name[0].toUpperCase();
    return Container(
      color: AppColors.primaryLight,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: AppTextStyles.h1.copyWith(
          color: AppColors.primary,
          fontSize: 64,
        ),
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

  Widget _buildActions(WidgetRef ref, String userId) {
    return Container(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20, top: 20),
      child: Row(
        children: [
          Expanded(
            child: SecondaryButton(
              onPressed: () =>
                  ref.read(exploreProvider.notifier).handlePass(userId),
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
                  ref.read(exploreProvider.notifier).handleInterested(userId),
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
