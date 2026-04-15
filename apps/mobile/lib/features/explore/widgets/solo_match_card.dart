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
import '../../../core/widgets/common/user_avatar_fallback.dart';

class SoloMatchCard extends ConsumerWidget {
  final MatchUser match;

  const SoloMatchCard({super.key, required this.match});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String name = match.name;
    final int? age = match.age;
    final String? bio = match.bio;

    final DateTime? startDate = match.startDate;
    final DateTime? endDate = match.endDate;

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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Mobile Header Section
              Padding(
                padding: const EdgeInsets.only(left: 20, right: 20, top: 12),
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
                                errorWidget: (context, url, dynamic error) =>
                                    UserAvatarFallback(
                                      name: match.name,
                                      backgroundColor: AppColors.primaryLight,
                                      iconColor: AppColors.primary,
                                      shape: BoxShape.rectangle,
                                      borderRadius: BorderRadius.circular(16),
                                      fontSize: 64,
                                    ),
                              )
                            : UserAvatarFallback(size: 100),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      age != null ? "$name, $age" : name,
                      style: AppTextStyles.h3,
                    ),

                    const SizedBox(height: 4),
                    Text(
                      (bio != null && bio.isNotEmpty)
                          ? bio
                          : 'No bio provided.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.mutedForeground,
                        fontStyle: (bio != null && bio.isNotEmpty)
                            ? FontStyle.normal
                            : FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
              const Divider(indent: 20, endIndent: 20, color: AppColors.border),

              // Content Sections
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle('Trip Details'),
                    _buildPillList([
                      if (match.destination.isNotEmpty)
                        _PillData(
                          icon: Icons.location_on_outlined,
                          label: match.destination.split(',')[0],
                        ),
                      if (dateRange != null)
                        _PillData(
                          icon: Icons.calendar_today_outlined,
                          label: dateRange,
                        ),
                      if (tripLength != null)
                        _PillData(
                          icon: Icons.calendar_today_outlined,
                          label: "$tripLength days",
                        ),
                      if (match.budget != null && match.budget! > 0)
                        _PillData(
                          icon: Icons.currency_rupee,
                          label: NumberFormat.decimalPattern(
                            'en_IN',
                          ).format(match.budget),
                        ),
                    ]),

                    const SizedBox(height: 24),

                    _buildSectionTitle('About Me'),
                    _buildPillList([
                      if (match.gender != null && match.gender!.isNotEmpty)
                        _PillData(
                          icon: Icons.account_circle_outlined,
                          label:
                              match.gender![0].toUpperCase() +
                              match.gender!.substring(1),
                        ),
                      if (match.nationality != null &&
                          match.nationality!.isNotEmpty)
                        _PillData(
                          icon: Icons.language,
                          label: match.nationality ?? '',
                        ),
                      if (match.location.isNotEmpty)
                        _PillData(
                          icon: Icons.home_outlined,
                          label: match.location,
                        ),
                      if (match.profession != null &&
                          match.profession!.isNotEmpty)
                        _PillData(
                          icon:
                              match.profession!.toLowerCase().contains(
                                'student',
                              )
                              ? Icons.school_outlined
                              : Icons.work_outline,
                          label:
                              match.profession![0].toUpperCase() +
                              match.profession!.substring(1),
                        ),
                      if (match.personality != null &&
                          match.personality!.isNotEmpty)
                        _PillData(
                          icon: Icons.menu_book_outlined,
                          label: match.personality ?? '',
                        ),
                      if (match.religion != null && match.religion!.isNotEmpty)
                        _PillData(
                          icon: Icons.collections_bookmark_outlined,
                          label: match.religion ?? '',
                        ),

                      ...match.languages.map(
                        (lang) => _PillData(
                          icon: Icons.chat_bubble_outline,
                          label: lang,
                        ),
                      ),
                    ]),

                    const SizedBox(height: 24),

                    if (match.interests.isNotEmpty) ...[
                      _buildSectionTitle('My Interests'),

                      _buildPillList(
                        match.interests
                            .map((i) => _PillData(label: i))
                            .toList(),
                      ),
                      const SizedBox(height: 24),
                    ],

                    if ((match.foodPreference != null &&
                            match.foodPreference!.isNotEmpty) ||
                        (match.smoking != null && match.smoking!.isNotEmpty) ||
                        (match.drinking != null &&
                            match.drinking!.isNotEmpty)) ...[
                      _buildSectionTitle('Lifestyle'),
                      _buildPillList([
                        if (match.foodPreference != null &&
                            match.foodPreference!.isNotEmpty)
                          _PillData(
                            icon: Icons.restaurant,
                            label: match.foodPreference!,
                          ),
                        if (match.smoking != null && match.smoking!.isNotEmpty)
                          _PillData(
                            icon: Icons.smoking_rooms,
                            label:
                                match.smoking![0].toUpperCase() +
                                match.smoking!.substring(1),
                          ),
                        if (match.drinking != null &&
                            match.drinking!.isNotEmpty)
                          _PillData(
                            icon: Icons.local_bar,
                            label:
                                match.drinking![0].toUpperCase() +
                                match.drinking!.substring(1),
                          ),
                      ]),
                    ],
                  ],
                ),
              ),
              const Divider(indent: 20, endIndent: 20, color: AppColors.border),
              _buildActions(ref, match.id),
            ],
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
      spacing: 6,
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
            style: AppTextStyles.bodyMedium.copyWith(
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
