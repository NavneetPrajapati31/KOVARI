import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/widgets/common/kovari_image.dart';
import 'package:mobile/core/widgets/common/user_avatar_fallback.dart';
import 'package:mobile/features/explore/providers/explore_provider.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/secondary_button.dart';

/// Explore group match card — mobile layout aligned with
/// `apps/web/src/features/explore/components/GroupMatchCard.tsx` (md:hidden view).
class GroupMatchCard extends ConsumerStatefulWidget {
  const GroupMatchCard({super.key, required this.group});
  final GroupModel group;

  @override
  ConsumerState<GroupMatchCard> createState() => _GroupMatchCardState();
}

class _GroupMatchCardState extends ConsumerState<GroupMatchCard> {
  String _activeTab = 'left';

  bool _isPreferNotToSay(String? val) {
    if (val == null) return false;
    final clean = val.toLowerCase().replaceAll('_', ' ');
    return clean == 'prefer not to say';
  }

  String _capitalize(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return trimmed;
    return trimmed[0].toUpperCase() + trimmed.substring(1);
  }

  String _capitalizeUnderscore(String? value) {
    if (value == null) return '';
    return _capitalize(value.replaceAll('_', ' ').trim());
  }

  String? _creatorDisplayName(GroupCreator creator) {
    if (creator.name.isNotEmpty && creator.name != 'Unknown') {
      return creator.name;
    }
    if (creator.username.isNotEmpty && creator.username != 'unknown') {
      return '@${creator.username}';
    }
    return null;
  }

  String _destinationDisplay(String destination) {
    return destination.split(',').first.trim();
  }

  String _formatDateRange() {
    final startStr = widget.group.dateRange.start;
    final endStr = widget.group.dateRange.end;
    if (startStr == null && endStr == null) return 'Dates TBD';

    final startDate = startStr != null ? DateTime.tryParse(startStr) : null;
    final endDate = endStr != null ? DateTime.tryParse(endStr) : null;
    if (startDate != null && endDate != null) {
      final formatter = DateFormat('MMM d, yyyy');
      return '${formatter.format(startDate)} - ${formatter.format(endDate)}';
    }
    return 'Dates TBD';
  }

  String? _formatGroupSmokingPolicy(String? policy) {
    if (policy == null || _isPreferNotToSay(policy)) return null;
    final normalized = policy.toLowerCase();
    if (normalized.contains('non-smok') || normalized == 'non-smoking') {
      return 'No smoking';
    }
    if (normalized.contains('smokers welcome') ||
        normalized.contains('smoking allowed')) {
      return 'Smoking allowed';
    }
    return 'Smoking allowed';
  }

  String? _formatGroupDrinkingPolicy(String? policy) {
    if (policy == null || _isPreferNotToSay(policy)) return null;
    final normalized = policy.toLowerCase();
    if (normalized.contains('non-drink') || normalized == 'non-drinking') {
      return 'No alcohol';
    }
    if (normalized.contains('drinkers welcome') ||
        normalized.contains('alcohol allowed')) {
      return 'Alcohol allowed';
    }
    return 'Alcohol allowed';
  }

  String? _formatCreatorSmoking(String? value) {
    if (value == null || _isPreferNotToSay(value)) return null;
    final normalized = value.toLowerCase();
    if (normalized == 'no') return 'Smoking: No';
    if (normalized == 'yes') return 'Smoking: Yes';
    return 'Smoking: ${_capitalize(value.replaceAll('_', ' '))}';
  }

  String? _formatCreatorDrinking(String? value) {
    if (value == null || _isPreferNotToSay(value)) return null;
    final normalized = value.toLowerCase();
    if (normalized == 'no') return 'Drinking: No';
    if (normalized == 'yes') return 'Drinking: Yes';
    return 'Drinking: ${_capitalize(value.replaceAll('_', ' '))}';
  }

  TextStyle _infoTextStyle(BuildContext context) => AppTextStyles.bodyMedium
      .copyWith(fontWeight: FontWeight.w600, color: AppColors.text(context));

  TextStyle _mutedBulletStyle(BuildContext context) =>
      AppTextStyles.bodyMedium.copyWith(
        color: AppColors.text(context, isMuted: true),
      );

  Widget _buildInfoBlock({required Widget child}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.secondaryColor(context),
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }

  Widget _buildBulletText(
    BuildContext context,
    List<String> items, {
    TextStyle? style,
  }) {
    if (items.isEmpty) return const SizedBox.shrink();
    final textStyle = style ?? _infoTextStyle(context);
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text('•', style: _mutedBulletStyle(context)),
            ),
          Text(items[i], style: textStyle),
        ],
      ],
    );
  }

  Widget _buildMediaFrame({required Widget child}) {
    return Center(
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxHeight: 280),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.secondaryColor(context),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderColor(context)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: AspectRatio(aspectRatio: 4 / 3, child: child),
        ),
      ),
    );
  }

  Widget _buildStoryIndicators() {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _activeTab = 'left'),
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: _activeTab == 'left'
                    ? AppColors.activeIndicatorColor(context)
                    : AppColors.secondaryColor(context),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _activeTab = 'right'),
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: _activeTab == 'right'
                    ? AppColors.activeIndicatorColor(context)
                    : AppColors.secondaryColor(context),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeftTab(BuildContext context, GroupModel group) {
    final creator = group.creator;
    final coverImage = group.coverImage;
    final creatorName = _creatorDisplayName(creator);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildMediaFrame(
          child: coverImage != null && coverImage.isNotEmpty
              ? KovariImage(
                  imageUrl: coverImage,
                  fit: BoxFit.cover,
                  borderRadius: BorderRadius.circular(15),
                  placeholder: const UserAvatarFallback(
                    shape: BoxShape.rectangle,
                    borderRadius: BorderRadius.all(Radius.circular(16)),
                    size: 100,
                  ),
                )
              : const UserAvatarFallback(
                  shape: BoxShape.rectangle,
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                  size: 100,
                ),
        ),
        _buildInfoBlock(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${_destinationDisplay(group.destination)}${group.budget != null ? ' • ₹${NumberFormat.decimalPattern('en_IN').format(group.budget)}' : ''}',
                style: _infoTextStyle(context),
              ),
              const SizedBox(height: 4),
              Text(_formatDateRange(), style: _infoTextStyle(context)),
            ],
          ),
        ),
        if (creatorName != null || group.memberCount > 0)
          _buildInfoBlock(
            child: _buildBulletText(context, [
              if (creatorName != null) 'Created by $creatorName',
              if (group.memberCount > 0) '${group.memberCount} members',
            ]),
          ),
        if (group.tags != null && group.tags!.isNotEmpty)
          _buildInfoBlock(
            child: _buildBulletText(
              context,
              group.tags!.map(_capitalize).toList(),
            ),
          ),
        if (group.languages != null && group.languages!.isNotEmpty)
          _buildInfoBlock(
            child: _buildBulletText(context, group.languages!),
          ),
        if ((group.smokingPolicy != null &&
                !_isPreferNotToSay(group.smokingPolicy)) ||
            (group.drinkingPolicy != null &&
                !_isPreferNotToSay(group.drinkingPolicy)))
          _buildInfoBlock(
            child: _buildBulletText(context, [
              if (_formatGroupSmokingPolicy(group.smokingPolicy) case final smoking?)
                'Smoking: $smoking',
              if (_formatGroupDrinkingPolicy(group.drinkingPolicy)
                  case final drinking?)
                'Drinking: $drinking',
            ]),
          ),
      ],
    );
  }

  Widget _buildRightTab(BuildContext context, GroupModel group) {
    final creator = group.creator;
    final hasGender = creator.gender != null &&
        creator.gender!.trim().isNotEmpty &&
        !_isPreferNotToSay(creator.gender);
    final detailItems = [
      if (creator.profession != null &&
          creator.profession!.trim().isNotEmpty &&
          !_isPreferNotToSay(creator.profession))
        _capitalizeUnderscore(creator.profession),
      if (creator.religion != null &&
          creator.religion!.trim().isNotEmpty &&
          !_isPreferNotToSay(creator.religion))
        _capitalize(creator.religion!.trim()),
      if (creator.personality != null &&
          creator.personality!.trim().isNotEmpty &&
          !_isPreferNotToSay(creator.personality))
        _capitalize(creator.personality!.trim()),
    ].where((item) => item.isNotEmpty).toList();

    final lifestyleItems = [
      if (creator.foodPreference != null &&
          !_isPreferNotToSay(creator.foodPreference))
        _capitalizeUnderscore(creator.foodPreference),
      if (_formatCreatorSmoking(creator.smoking) case final smoking?) smoking,
      if (_formatCreatorDrinking(creator.drinking) case final drinking?)
        drinking,
    ].where((item) => item.isNotEmpty).toList();

    final showAboutBlock =
        hasGender || detailItems.isNotEmpty || creator.languages.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildMediaFrame(
          child: creator.avatar != null && creator.avatar!.isNotEmpty
              ? KovariImage(
                  imageUrl: creator.avatar!,
                  fit: BoxFit.cover,
                  borderRadius: BorderRadius.circular(15),
                  placeholder: const UserAvatarFallback(
                    shape: BoxShape.rectangle,
                    borderRadius: BorderRadius.all(Radius.circular(16)),
                    size: 100,
                  ),
                )
              : const UserAvatarFallback(
                  shape: BoxShape.rectangle,
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                  size: 100,
                ),
        ),
        if (showAboutBlock)
          _buildInfoBlock(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasGender) ...[
                  Text(_capitalize(creator.gender!), style: _infoTextStyle(context)),
                  if (detailItems.isNotEmpty || creator.languages.isNotEmpty)
                    const SizedBox(height: 4),
                ],
                if (detailItems.isNotEmpty)
                  _buildBulletText(context, detailItems),
                if (creator.languages.isNotEmpty) ...[
                  if (detailItems.isNotEmpty) const SizedBox(height: 4),
                  Text(
                    creator.languages.join(', '),
                    style: _infoTextStyle(context),
                  ),
                ],
              ],
            ),
          ),
        if (creator.interests.isNotEmpty)
          _buildInfoBlock(
            child: _buildBulletText(
              context,
              creator.interests.map(_capitalize).toList(),
            ),
          ),
        if (lifestyleItems.isNotEmpty)
          _buildInfoBlock(
            child: _buildBulletText(context, lifestyleItems),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final group = widget.group;
    final creator = group.creator;
    final creatorLocationDisplay =
        creator.location != null && creator.location!.isNotEmpty
        ? creator.location!.split(',').first.trim()
        : 'Unknown';

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      borderRadius: BorderRadius.circular(24),
      border: const Border(),
      boxShadow: const [],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragEnd: (details) {
                if (details.primaryVelocity == null) return;
                if (details.primaryVelocity! < 0 &&
                    _activeTab == 'left') {
                  setState(() => _activeTab = 'right');
                } else if (details.primaryVelocity! > 0 &&
                    _activeTab == 'right') {
                  setState(() => _activeTab = 'left');
                }
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStoryIndicators(),
                  const SizedBox(height: 12),
                  if (_activeTab == 'left') ...[
                    Text(
                      group.name,
                      style: AppTextStyles.h3.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.text(context),
                      ),
                    ),
                    Text(
                      group.description != null && group.description!.isNotEmpty
                          ? group.description!
                          : 'No description provided.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.text(context, isMuted: true),
                        fontWeight: FontWeight.w500,
                        fontStyle:
                            group.description != null &&
                                group.description!.isNotEmpty
                            ? FontStyle.normal
                            : FontStyle.italic,
                      ),
                    ),
                  ] else ...[
                    Text(
                      'Created by ${creator.name}',
                      style: AppTextStyles.h3.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.text(context),
                      ),
                    ),
                    Text(
                      creator.age != null
                          ? '${creator.age}, $creatorLocationDisplay'
                          : creatorLocationDisplay,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w500,
                        color: AppColors.text(context, isMuted: true),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: _activeTab == 'left'
                          ? _buildLeftTab(context, group)
                          : _buildRightTab(context, group),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: PrimaryButton(
                  key: ValueKey('interested_${group.id}'),
                  text: 'Interested',
                  height: 48,
                  borderRadius: 16,
                  onPressed: () => ref
                      .read(exploreProvider.notifier)
                      .handleInterested(group.id),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SecondaryButton(
                  key: ValueKey('skip_${group.id}'),
                  text: 'Skip',
                  height: 48,
                  borderRadius: 16,
                  onPressed: () =>
                      ref.read(exploreProvider.notifier).handlePass(group.id),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
