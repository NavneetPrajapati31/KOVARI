import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/widgets/common/user_avatar_fallback.dart';
import 'package:mobile/features/explore/providers/explore_provider.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/secondary_button.dart';

class GroupMatchCard extends ConsumerWidget {

  const GroupMatchCard({super.key, required this.group});
  final GroupModel group;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = group.name;
    final description = group.description;
    final coverImage = group.coverImage;
    final memberCount = group.memberCount;
    final creator = group.creator;

    final startDate = group.dateRange.start != null
        ? DateTime.tryParse(group.dateRange.start!)
        : null;
    final endDate = group.dateRange.end != null
        ? DateTime.tryParse(group.dateRange.end!)
        : null;
    final dateRange = startDate != null && endDate != null
        ? "${DateFormat('MMM d').format(startDate)} - ${DateFormat('MMM d, yyyy').format(endDate)}"
        : 'Dates TBD';
    final tripLength = startDate != null && endDate != null
        ? endDate.difference(startDate).inDays + 1
        : null;

    return AppCard(
      padding: EdgeInsets.zero,
      borderRadius: BorderRadius.circular(24),
      border: const Border(),
      boxShadow: const [],
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
                          color: AppColors.surface(context, level: 2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: coverImage != null && coverImage.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: coverImage,
                                fit: BoxFit.cover,
                                placeholder: (context, url) =>
                                    const UserAvatarFallback(
                                      shape: BoxShape.rectangle,
                                      borderRadius: BorderRadius.all(
                                        Radius.circular(16),
                                      ),
                                      size: 100,
                                    ),
                                errorWidget: (context, url, dynamic error) =>
                                    const UserAvatarFallback(
                                      shape: BoxShape.rectangle,
                                      borderRadius: BorderRadius.all(
                                        Radius.circular(16),
                                      ),
                                      size: 100,
                                    ),
                              )
                            : UserAvatarFallback(
                                shape: BoxShape.rectangle,
                                borderRadius: BorderRadius.circular(16),
                                size: 100,
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      name,
                      style: AppTextStyles.h3.copyWith(
                        color: AppColors.text(context),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      (description != null && description.isNotEmpty)
                          ? description
                          : 'No description provided.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.text(context, isMuted: true),
                        fontStyle:
                            (description != null && description.isNotEmpty)
                            ? FontStyle.normal
                            : FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
              Divider(
                indent: 20,
                endIndent: 20,
                color: AppColors.borderColor(context),
              ),

              // Content Sections
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle(context, 'Trip Details'),
                    _buildPillList(context, [
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
                          label: '$tripLength days',
                        ),
                      if (group.budget != null && group.budget! > 0)
                        _PillData(
                          icon: Icons.currency_rupee,
                          label: NumberFormat.decimalPattern(
                            'en_IN',
                          ).format(group.budget),
                        ),
                    ]),
                    const SizedBox(height: 24),

                    _buildSectionTitle(context, 'About'),
                    _buildPillList(context, [
                      _PillData(
                        icon: Icons.person_pin_outlined,
                        label: 'By ${creator.name}',
                      ),
                      _PillData(
                        icon: Icons.group_outlined,
                        label: '$memberCount members',
                      ),
                    ]),

                    if (group.tags != null && group.tags!.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      _buildSectionTitle(context, 'Group Interests'),
                      _buildPillList(
                        context,
                        group.tags!
                            .map((i) => _PillData(label: i.toString()))
                            .toList(),
                      ),
                      const SizedBox(height: 24),
                    ],

                    if (group.languages != null &&
                        group.languages!.isNotEmpty) ...[
                      _buildSectionTitle(context, 'Languages'),
                      _buildPillList(
                        context,
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

                    if ((group.smokingPolicy != null &&
                            group.smokingPolicy!.isNotEmpty) ||
                        (group.drinkingPolicy != null &&
                            group.drinkingPolicy!.isNotEmpty)) ...[
                      _buildSectionTitle(context, 'Lifestyle'),
                      _buildPillList(context, [
                        if (group.smokingPolicy != null &&
                            group.smokingPolicy!.isNotEmpty)
                          _PillData(
                            icon: Icons.smoking_rooms,
                            label: group.smokingPolicy!,
                          ),
                        if (group.drinkingPolicy != null &&
                            group.drinkingPolicy!.isNotEmpty)
                          _PillData(
                            icon: Icons.local_bar,
                            label: group.drinkingPolicy!,
                          ),
                      ]),
                    ],
                  ],
                ),
              ),
              Divider(
                indent: 20,
                endIndent: 20,
                color: AppColors.borderColor(context),
              ),
              _buildActions(ref, group.id),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) => Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title.toUpperCase(),
        style: AppTextStyles.bodySmall.copyWith(
          fontWeight: FontWeight.bold,
          color: AppColors.text(context, isMuted: true),
          letterSpacing: 1.2,
        ),
      ),
    );

  Widget _buildPillList(BuildContext context, List<_PillData> pills) => Wrap(
      spacing: 6,
      runSpacing: 8,
      children: pills.map((pill) => _buildPill(context, pill)).toList(),
    );

  Widget _buildPill(BuildContext context, _PillData data) => AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      borderRadius: BorderRadius.circular(20),
      backgroundColor: AppColors.mutedColor(context),
      boxShadow: const [],
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (data.icon != null) ...[
            Icon(data.icon, size: 16, color: AppColors.text(context)),
            const SizedBox(width: 8),
          ],
          Text(
            data.label,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.text(context),
            ),
          ),
        ],
      ),
    );

  Widget _buildActions(WidgetRef ref, String groupId) => Container(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20, top: 20),
      child: Row(
        children: [
          Expanded(
            child: SecondaryButton(
              onPressed: () =>
                  ref.read(exploreProvider.notifier).handlePass(groupId),
              icon: Icons.close_rounded,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SecondaryButton(
              onPressed: () => {},
              icon: Icons.flag_outlined,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: PrimaryButton(
              onPressed: () =>
                  ref.read(exploreProvider.notifier).handleInterested(groupId),
              icon: Icons.check_rounded,
            ),
          ),
        ],
      ),
    );
}

class _PillData {

  _PillData({this.icon, required this.label});
  final IconData? icon;
  final String label;
}
