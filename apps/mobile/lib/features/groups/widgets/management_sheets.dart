import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/shared/widgets/kovari_avatar.dart';
import 'package:mobile/shared/widgets/secondary_button.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/features/groups/providers/group_details_provider.dart';
import 'package:mobile/features/groups/widgets/edit_group_sheets.dart';
import 'package:mobile/features/groups/widgets/settings_widgets.dart';

/// 👥 Manage Group Members (Admin only view with Remove options)
class GroupMembersManagementSheet extends ConsumerWidget {
  final GroupModel group;
  final bool isAdmin;

  const GroupMembersManagementSheet({
    super.key,
    required this.group,
    required this.isAdmin,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(groupMembersProvider(group.id));

    return SettingsBottomSheet(
      title: "Group Members",
      children: [
        membersAsync.when(
          data: (members) => KovariGroupContainer(
            backgroundColor: AppColors.card,
            children: members.map((member) {
              final isOtherAdmin = member.role == 'admin';

              return Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    KovariAvatar(imageUrl: member.avatar, size: 42),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            member.name,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          // const SizedBox(height: 1),
                          Text(
                            "@${member.username}",
                            style: AppTextStyles.bodySmall.copyWith(
                              fontSize: 13,
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
                          borderRadius: BorderRadius.circular(
                            100,
                          ), // Pill shape
                        ),
                        child: Text(
                          "Admin",
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                    if (isAdmin && !isOtherAdmin)
                      GestureDetector(
                        onTap: () => _confirmRemove(context, ref, member),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 4,
                          ),
                          child: Text(
                            "Remove",
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.destructive,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            }).toList(),
          ),
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (e, _) => Center(child: Text("Error: $e")),
        ),
      ],
    );
  }

  void _confirmRemove(BuildContext context, WidgetRef ref, GroupMember member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Remove Member?"),
        content: Text(
          "Are you sure you want to remove ${member.name} from the group?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              ref
                  .read(groupActionsProvider(group.id))
                  .removeMember(member.id, member.clerkId ?? '');
              Navigator.pop(context);
            },
            child: const Text(
              "Remove",
              style: TextStyle(color: AppColors.destructive),
            ),
          ),
        ],
      ),
    );
  }
}

/// 📥 Manage Join Requests
class JoinRequestsSheet extends ConsumerWidget {
  final GroupModel group;
  const JoinRequestsSheet({super.key, required this.group});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(joinRequestsProvider(group.id));

    return SettingsBottomSheet(
      title: "Join Requests",
      children: [
        requestsAsync.when(
          data: (requests) {
            if (requests.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Text(
                    "No pending requests.",
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ),
              );
            }
            return KovariGroupContainer(
              backgroundColor: AppColors.card,
              children: requests.map((request) {
                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      KovariAvatar(imageUrl: request.avatar, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              request.name,
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            // const SizedBox(height: 1),
                            Text(
                              "@${request.username}",
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 13,
                                color: AppColors.mutedForeground,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: () => ref
                                .read(groupActionsProvider(group.id))
                                .approveRequest(request.userId),
                            child: const Icon(
                              LucideIcons.check,
                              color: AppColors.primary,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          GestureDetector(
                            onTap: () => ref
                                .read(groupActionsProvider(group.id))
                                .rejectRequest(request.id),
                            child: const Icon(
                              LucideIcons.x,
                              color: AppColors.foreground,
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }).toList(),
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (e, _) => Center(child: Text("Error: $e")),
        ),
      ],
    );
  }
}

/// ✉️ Invite Members (Email/Username/Link)
class InviteMembersSheet extends ConsumerStatefulWidget {
  final GroupModel group;
  const InviteMembersSheet({super.key, required this.group});

  @override
  ConsumerState<InviteMembersSheet> createState() => _InviteMembersSheetState();
}

class _InviteMembersSheetState extends ConsumerState<InviteMembersSheet> {
  final TextEditingController _inviteController = TextEditingController();
  String _inviteLink = "";
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _fetchLink();
  }

  Future<void> _fetchLink() async {
    final link = await ref
        .read(groupActionsProvider(widget.group.id))
        .getInviteLink();
    if (mounted) setState(() => _inviteLink = link);
  }

  Future<void> _handleInvite() async {
    if (_inviteController.text.trim().isEmpty) return;
    setState(() => _isSending = true);
    try {
      await ref
          .read(groupActionsProvider(widget.group.id))
          .inviteMember(_inviteController.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Invitation sent!")));
        _inviteController.clear();
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsBottomSheet(
      title: "Invite Member",
      isSubmitting: _isSending,
      onSave: _handleInvite,
      buttonLabel: "Send Invitation",
      children: [
        TextInputField(
          label: "Email or Username",
          controller: _inviteController,
          hintText: "Enter email or username",
          onChanged: (val) => setState(() {}), // Force rebuild for button state
        ),
        const SizedBox(height: 24),
        KovariSection(
          title: "Shareable Link",
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        LucideIcons.link,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _inviteLink.isNotEmpty
                              ? _inviteLink
                              : "Generating link...",
                          style: AppTextStyles.bodySmall.copyWith(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.foreground,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SecondaryButton(
                    text: "Copy Link",
                    onPressed: _inviteLink.isEmpty
                        ? null
                        : () {
                            // Link copying logic
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Link copied to clipboard!"),
                              ),
                            );
                          },
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}
