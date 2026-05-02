import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/utils/custom_route_transition.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_radius.dart';
import '../providers/group_provider.dart';
import '../widgets/group_card.dart';
import '../widgets/group_card_skeleton.dart';
import 'create_group_screen.dart';
import 'group_details_screen.dart';

class GroupsScreen extends ConsumerWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupState = ref.watch(myGroupsProvider);

    return Material(
      color: AppColors.background,
      child: SafeArea(
        child: Column(
          children: [
            // Sticky Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  _buildTabButton("My Groups", true),
                  const SizedBox(width: 8),
                  _buildTabButton(
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
              child: RefreshIndicator(
                onRefresh: () => ref.read(myGroupsProvider.notifier).refresh(),
                color: AppColors.primary,
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
      ),
    );
  }

  Widget _buildSliverContent(
    BuildContext context,
    WidgetRef ref,
    dynamic state,
  ) {
    if (state.isLoading && state.groups.isEmpty) {
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        sliver: SliverToBoxAdapter(
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.card,
              border: Border.all(color: AppColors.border),
              borderRadius: AppRadius.large,
            ),
            child: ClipRRect(
              borderRadius: AppRadius.large,
              child: Column(
                children: List.generate(
                  5,
                  (i) => Column(
                    children: [
                      const GroupCardSkeleton(),
                      if (i < 4)
                        const Divider(height: 1, color: AppColors.border),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    if (state.error != null && state.groups.isEmpty) {
      return SliverFillRemaining(child: Center(child: Text(state.error!)));
    }

    if (state.groups.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  color: AppColors.secondary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.users,
                  size: 32,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 24),
              Text("No groups yet", style: AppTextStyles.h3),
              const SizedBox(height: 8),
              const Text(
                "Create or join a group to start planning.",
                style: TextStyle(color: AppColors.mutedForeground),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      sliver: SliverToBoxAdapter(
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            border: Border.all(color: AppColors.border),
            borderRadius: AppRadius.large,
          ),
          child: ClipRRect(
            borderRadius: AppRadius.large,
            clipBehavior: Clip.antiAliasWithSaveLayer,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    for (int i = 0; i < state.groups.length; i++) ...[
                      RepaintBoundary(
                        child: GroupCard(
                          group: state.groups[i],
                          onAction: () {
                            Navigator.push(
                              context,
                              PremiumPageRoute(
                                builder: (context) => GroupDetailsScreen(
                                  groupId: state.groups[i].id,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      if (i < state.groups.length - 1)
                        const Divider(height: 1, color: AppColors.border),
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

  Widget _buildTabButton(String label, bool isSelected, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: AppTextStyles.bodySmall.fontSize,
            fontWeight: FontWeight.w600,
            color: isSelected ? AppColors.primary : AppColors.foreground,
          ),
        ),
      ),
    );
  }
}
