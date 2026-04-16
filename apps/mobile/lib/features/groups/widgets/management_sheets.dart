import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/shared/widgets/kovari_avatar.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/secondary_button.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/features/groups/providers/group_details_provider.dart';
import 'package:mobile/features/groups/widgets/edit_group_sheets.dart';

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
      onSave: () => Navigator.pop(context),
      children: [
        SizedBox(
          height: 400,
          child: membersAsync.when(
            data: (members) => ListView.builder(
              itemCount: members.length,
              itemBuilder: (context, index) {
                final member = members[index];
                final isSelf = member.clerkId == null; // Simplified self-check
                final isOtherAdmin = member.role == 'admin';

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Row(
                    children: [
                      KovariAvatar(imageUrl: member.avatar, size: 40),
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
                            Text(
                              "@${member.username}",
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 12,
                                color: AppColors.mutedForeground,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (member.role == 'admin')
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
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
                      if (isAdmin && !isOtherAdmin)
                        IconButton(
                          padding: EdgeInsets.zero,
                          onPressed: () => _confirmRemove(context, ref, member),
                          icon: const Icon(
                            LucideIcons.userMinus,
                            size: 18,
                            color: AppColors.destructive,
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text("Error: $e")),
          ),
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
      onSave: () => Navigator.pop(context),
      children: [
        SizedBox(
          height: 400,
          child: requestsAsync.when(
            data: (requests) {
              if (requests.isEmpty) {
                return Center(
                  child: Text(
                    "No pending requests.",
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.mutedForeground,
                    ),
                  ),
                );
              }
              return ListView.builder(
                itemCount: requests.length,
                itemBuilder: (context, index) {
                  final request = requests[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Row(
                      children: [
                        KovariAvatar(imageUrl: request.avatar, size: 40),
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
                              Text(
                                "@${request.username}",
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontSize: 12,
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              onPressed: () => ref
                                  .read(groupActionsProvider(group.id))
                                  .approveRequest(request.userId),
                              icon: const Icon(
                                LucideIcons.circleCheck,
                                color: Colors.green,
                              ),
                            ),
                            IconButton(
                              onPressed: () => ref
                                  .read(groupActionsProvider(group.id))
                                  .rejectRequest(request.id),
                              icon: const Icon(
                                LucideIcons.circleX,
                                color: AppColors.destructive,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text("Error: $e")),
          ),
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
      children: [
        TextInputField(
          label: "Email or Username",
          controller: _inviteController,
          hintText: "e.g. travel_buddy or buddy@email.com",
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
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
                  Text(
                    "Shareable Link",
                    style: AppTextStyles.bodySmall.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppColors.mutedForeground,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _inviteLink.isNotEmpty ? _inviteLink : "Generating link...",
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 12,
                  color: AppColors.mutedForeground,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              SecondaryButton(
                text: "Copy Link",
                onPressed: _inviteLink.isEmpty
                    ? null
                    : () {
                        // Link copying logic would go here
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
    );
  }
}
