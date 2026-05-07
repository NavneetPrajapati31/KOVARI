import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../providers/group_details_provider.dart';
import '../models/group.dart';
import '../widgets/group_tab_bar.dart';
import '../widgets/tabs/overview_tab.dart';
import '../widgets/tabs/chats_tab.dart';
import '../widgets/tabs/itinerary_tab.dart';
import '../widgets/tabs/settings_tab.dart';
import '../../../shared/widgets/app_card.dart';

class GroupDetailsScreen extends ConsumerStatefulWidget {
  final String groupId;

  GroupDetailsScreen({super.key, required this.groupId}) {
    debugPrint('🚀 [GroupDetailsScreen] Constructor called for ID: $groupId');
  }

  @override
  ConsumerState<GroupDetailsScreen> createState() => _GroupDetailsScreenState();
}

class _GroupDetailsScreenState extends ConsumerState<GroupDetailsScreen> {
  final TextEditingController _notesController = TextEditingController();
  bool _isEditingNotes = false;
  int _activeTabIndex = 0;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    debugPrint(
      '🏗️ [GroupDetailsScreen] Building screen for ID: ${widget.groupId}',
    );
    final groupAsync = ref.watch(groupDetailsProvider(widget.groupId));
    final membershipAsync = ref.watch(groupMembershipProvider(widget.groupId));

    return groupAsync.when(
      data: (group) {
        debugPrint('✅ [GroupDetailsScreen] Group data loaded');
        return membershipAsync.when(
          data: (membership) {
            debugPrint(
              '✅ [GroupDetailsScreen] Membership data loaded: isMember=${membership.isMember}, isCreator=${membership.isCreator}',
            );
            if (group.status == 'pending') {
              return _buildPendingState();
            }

            if (!membership.isMember && !membership.isCreator) {
              return _buildJoinState(membership);
            }

            if (!_isEditingNotes &&
                group.notes != null &&
                _notesController.text != group.notes) {
              // Wrap in post-frame to avoid updating controller during build
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted &&
                    !_isEditingNotes &&
                    _notesController.text != group.notes) {
                  debugPrint(
                    '📝 [GroupDetailsScreen] Updating notes controller from group data',
                  );
                  _notesController.text = group.notes!;
                }
              });
            }

            return Scaffold(
              body: Column(
                children: [
                  Container(
                    color: AppColors.backgroundColor(context),
                    child: SafeArea(bottom: false, child: _buildHeader(group)),
                  ),
                  GroupTabBar(
                    activeIndex: _activeTabIndex,
                    onTabChanged: (index) =>
                        setState(() => _activeTabIndex = index),
                  ),
                  Expanded(
                    child: IndexedStack(
                      index: _activeTabIndex,
                      children: [
                        OverviewTab(
                          group: group,
                          isEditingNotes: _isEditingNotes,
                          notesController: _notesController,
                          onEditNotesToggle: () => setState(
                            () => _isEditingNotes = !_isEditingNotes,
                          ),
                          onTabChange: (index) =>
                              setState(() => _activeTabIndex = index),
                          onViewAllMembers: (members) =>
                              _showMembersModal(members),
                        ),
                        ChatsTab(group: group),
                        ItineraryTab(group: group),
                        SettingsTab(
                          group: group,
                          onViewMembers: () {
                            ref
                                .read(groupMembersProvider(widget.groupId))
                                .whenData(
                                  (members) => _showMembersModal(members),
                                );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () {
            debugPrint('⏳ [GroupDetailsScreen] Loading membership...');
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            );
          },
          error: (e, s) {
            debugPrint('❌ [GroupDetailsScreen] Membership error: $e');
            return _buildErrorState(e);
          },
        );
      },
      loading: () {
        debugPrint('⏳ [GroupDetailsScreen] Loading group details...');
        return const Scaffold(
          body: Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 3,
              ),
            ),
          ),
        );
      },
      error: (e, s) {
        debugPrint('❌ [GroupDetailsScreen] Group error: $e');
        return _buildErrorState(e);
      },
    );
  }

  Widget _buildHeader(GroupModel group) {
    return Container(
      padding: const EdgeInsets.only(left: 4, right: 16, top: 16, bottom: 6),
      child: Row(
        children: [
          _buildBackButton(context),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              group.name,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.text(context),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: Icon(
          LucideIcons.arrowLeft,
          size: 20,
          color: AppColors.text(context),
        ),
      ),
    );
  }

  Widget _buildErrorState(Object e) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LucideIcons.circleAlert,
              size: 48,
              color: AppColors.destructive,
            ),
            const SizedBox(height: 16),
            Text("Something went wrong", style: AppTextStyles.h3),
            const SizedBox(height: 8),
            Text(
              e.toString(),
              style: AppTextStyles.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SecondaryButton(
              text: "Retry",
              onPressed: () {
                ref.invalidate(groupDetailsProvider(widget.groupId));
                ref.invalidate(groupMembershipProvider(widget.groupId));
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPendingState() {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                LucideIcons.circleAlert,
                size: 64,
                color: AppColors.muted,
              ),
              const SizedBox(height: 24),
              Text(
                "Group Under Review",
                style: AppTextStyles.h2,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                "This group is currently pending admin approval and is not available for viewing or interaction.",
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.mutedForeground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                text: "Back to Groups",
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJoinState(MembershipInfo membership) {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.users, size: 64, color: AppColors.muted),
              const SizedBox(height: 24),
              Text(
                "Join the group",
                style: AppTextStyles.h2,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                "You need to be a member of this group to access its itinerary and notes.",
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.mutedForeground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                text: membership.hasPendingRequest
                    ? "Request Pending"
                    : "Request to Join Group",
                onPressed: membership.hasPendingRequest
                    ? null
                    : () {
                        ref
                            .read(groupActionsProvider(widget.groupId))
                            .joinRequest();
                      },
              ),
              const SizedBox(height: 12),
              SecondaryButton(
                text: "Back to Groups",
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showMembersModal(List<GroupMember> members) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AppCard(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(24),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderColor(context),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text("Group Members (${members.length})", style: AppTextStyles.h3),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: members.length,
                itemBuilder: (context, index) {
                  final member = members[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Row(
                      children: [
                        KovariAvatar(imageUrl: member.avatar, size: 48),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                member.name,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                "@${member.username}",
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (member.role == 'admin')
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              "Admin",
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
