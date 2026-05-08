import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/utils/custom_route_transition.dart';
import 'package:mobile/shared/widgets/kovari_refresh_indicator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_radius.dart';
import '../providers/entity_stores.dart';
import '../models/hydrated_state.dart';
import '../models/group.dart';
import '../widgets/group_card.dart';
import '../../../core/widgets/skeletons/kovari_skeletons.dart';
import 'create_group_screen.dart';
import 'group_details_screen.dart';
import '../../../shared/widgets/app_card.dart';

class GroupsScreen extends ConsumerWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupState = ref.watch(myGroupsStoreProvider);

    return SafeArea(
      child: Column(
        children: [
          // Sticky Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                _buildTabButton(context, "My Groups", true),
                const SizedBox(width: 8),
                _buildTabButton(
                  context,
                  "New group",
                  false,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const CreateGroupScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          // Scrollable Content
          Expanded(
            child: KovariRefreshIndicator(
              onRefresh: () =>
                  ref.read(myGroupsStoreProvider.notifier).refresh(),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  // 1. Stale Indicator
                  if (groupState.isStale)
                    const SliverToBoxAdapter(
                      child: LinearProgressIndicator(minHeight: 2),
                    ),

                  // 2. Body
                  _buildSliverContent(context, ref, groupState),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverContent(
    BuildContext context,
    WidgetRef ref,
    HydratedState<List<GroupModel>> state,
  ) {
    final groups = state.data ?? [];
    if (state.isHydrating && groups.isEmpty) {
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        sliver: SliverToBoxAdapter(
          child: AppCard(
            padding: EdgeInsets.zero,
            child: ClipRRect(
              borderRadius: AppRadius.large,
              child: Column(
                children: List.generate(
                  5,
                  (i) => Column(
                    children: [
                      const KovariSkeletonGroupListItem(),
                      if (i < 4)
                        Divider(
                          height: 1,
                          color: AppColors.borderColor(context),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    if (state.error != null && groups.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Text(
            state.error!,
            style: TextStyle(color: AppColors.text(context)),
          ),
        ),
      );
    }

    if (groups.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface(context, level: 2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.users,
                  size: 32,
                  color: AppColors.text(context, isMuted: true),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                "No groups yet",
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.text(context),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                "Create or join a group to start planning.",
                style: TextStyle(color: AppColors.text(context, isMuted: true)),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      sliver: SliverToBoxAdapter(
        child: AppCard(
          padding: EdgeInsets.zero,
          child: ClipRRect(
            borderRadius: AppRadius.large,
            clipBehavior: Clip.antiAliasWithSaveLayer,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    for (int i = 0; i < groups.length; i++) ...[
                      RepaintBoundary(
                        child: GroupCard(
                          group: groups[i],
                          onAction: () {
                            Navigator.push(
                              context,
                              PremiumPageRoute(
                                builder: (context) =>
                                    GroupDetailsScreen(groupId: groups[i].id),
                              ),
                            );
                          },
                        ),
                      ),
                      if (i < groups.length - 1)
                        Divider(
                          height: 1,
                          color: AppColors.borderColor(context),
                        ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(
    BuildContext context,
    String label,
    bool isSelected, {
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.surface(context, level: 1),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : AppColors.borderColor(context),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: AppTextStyles.bodySmall.fontSize,
            fontWeight: FontWeight.w600,
            color: isSelected
                ? AppColors.primary
                : AppColors.text(context, isMuted: true),
          ),
        ),
      ),
    );
  }
}
