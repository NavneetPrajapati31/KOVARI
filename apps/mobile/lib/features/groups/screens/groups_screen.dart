import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../providers/group_provider.dart';
import '../widgets/group_card.dart';
import '../widgets/group_card_skeleton.dart';
import 'create_group_screen.dart';
import 'group_details_screen.dart';

class GroupsScreen extends ConsumerWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupsAsync = ref.watch(myGroupsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
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
                onRefresh: () => ref.refresh(myGroupsProvider.future),
                color: AppColors.primary,
                child: CustomScrollView(
                  slivers: [
                    groupsAsync.when(
                      data: (groups) {
                        if (groups.isEmpty) {
                          return SliverFillRemaining(
                            hasScrollBody: false,
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    LucideIcons.users,
                                    size: 48,
                                    color: AppColors.muted,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    "You haven't joined any groups yet.",
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      color: AppColors.mutedForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        return SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate((
                              context,
                              index,
                            ) {
                              final group = groups[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16.0),
                                child: GroupCard(
                                  group: group,
                                  onAction: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            GroupDetailsScreen(
                                              groupId: group.id,
                                            ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            }, childCount: groups.length),
                          ),
                        );
                      },
                      loading: () => SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => const GroupCardSkeleton(),
                            childCount: 3,
                          ),
                        ),
                      ),
                      error: (error, stack) => SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                size: 48,
                                color: AppColors.destructive,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                "Failed to load groups. Please try again.",
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: AppColors.destructive,
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextButton(
                                onPressed: () => ref.refresh(myGroupsProvider),
                                child: const Text(
                                  "Retry",
                                  style: TextStyle(color: AppColors.primary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
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
          boxShadow: isSelected ? null : null,
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
