import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/shared/widgets/kovari_avatar.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/features/groups/providers/group_details_provider.dart';
import 'package:mobile/features/groups/widgets/edit_group_sheets.dart';
import 'package:mobile/features/groups/widgets/settings_widgets.dart';
import 'package:mobile/shared/widgets/kovari_confirm_dialog.dart';

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
              padding: EdgeInsets.symmetric(vertical: 50),
              child: SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 3),
              ),
            ),
          ),
          error: (e, _) => Center(child: Text("Error: $e")),
        ),
      ],
    );
  }

  void _confirmRemove(BuildContext context, WidgetRef ref, GroupMember member) {
    showKovariConfirmDialog(
      context: context,
      title: "Remove Member?",
      content: "Are you sure you want to remove ${member.name} from the group?",
      confirmLabel: "Remove",
      isDestructive: true,
      onConfirm: () {
        ref
            .read(groupActionsProvider(group.id))
            .removeMember(member.id, member.clerkId ?? '');
      },
    );
  }
}

/// 📥 Manage Join Requests
class JoinRequestsSheet extends ConsumerStatefulWidget {
  final GroupModel group;
  const JoinRequestsSheet({super.key, required this.group});

  @override
  ConsumerState<JoinRequestsSheet> createState() => _JoinRequestsSheetState();
}

class _JoinRequestsSheetState extends ConsumerState<JoinRequestsSheet> {
  final Set<String> _processingIds = {};

  Future<void> _handleAction(
    String userId,
    String? requestId,
    bool approve,
  ) async {
    if (_processingIds.contains(userId)) return;

    setState(() => _processingIds.add(userId));
    try {
      if (approve) {
        await ref
            .read(groupActionsProvider(widget.group.id))
            .approveRequest(userId);
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text("Member approved!")));
        }
      } else if (requestId != null) {
        await ref
            .read(groupActionsProvider(widget.group.id))
            .rejectRequest(requestId);
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text("Request rejected.")));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Action failed: $e")));
      }
    } finally {
      if (mounted) setState(() => _processingIds.remove(userId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(joinRequestsProvider(widget.group.id));

    return SettingsBottomSheet(
      title: "Join Requests",
      children: [
        requestsAsync.when(
          data: (requests) {
            if (requests.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 50),
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
                final isProcessing = _processingIds.contains(request.userId);

                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      KovariAvatar(imageUrl: request.avatar, size: 40),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              request.name,
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontSize: 13,
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
                      Opacity(
                        opacity: isProcessing ? 0.6 : 1.0,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            GestureDetector(
                              onTap: isProcessing
                                  ? null
                                  : () => _handleAction(
                                      request.userId,
                                      null,
                                      true,
                                    ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 7,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  "Accept",
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: isProcessing
                                  ? null
                                  : () => _handleAction(
                                      request.userId,
                                      request.id,
                                      false,
                                    ),
                              child: Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: Colors.transparent,
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(
                                    color: AppColors.mutedForeground.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                child: const Icon(
                                  LucideIcons.x,
                                  color: AppColors.mutedForeground,
                                  size: 15,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 50),
              child: SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 3),
              ),
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
  final TextEditingController _linkController = TextEditingController();
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
    if (mounted) {
      setState(() {
        _inviteLink = link;
        _linkController.text = link.isNotEmpty ? link : "Generate Link";
      });
    }
  }

  bool _isValidEmail(String input) =>
      RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(input.trim());

  bool _isValidUsername(String input) =>
      RegExp(r'^[a-zA-Z0-9_]{3,20}$').hasMatch(input.trim());

  bool get _canInvite {
    final trimmed = _inviteController.text.trim();
    return trimmed.isNotEmpty &&
        (_isValidEmail(trimmed) || _isValidUsername(trimmed));
  }

  Future<void> _handleInvite() async {
    if (!_canInvite) return;
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

  Future<void> _copyLink() async {
    if (_inviteLink.isEmpty) return;

    try {
      // 1. Copy to clipboard
      await Clipboard.setData(ClipboardData(text: _inviteLink));

      if (!mounted) return;

      // 2. Tactile feedback
      Feedback.forTap(context);

      // 3. Native Share (Raw URL only for maximum directness)
      await Share.share(_inviteLink, subject: "Trip Invitation");

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(
                  LucideIcons.circleCheck,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 12),
                Text(
                  "Link copied & sharing opened!",
                  style: AppTextStyles.bodyMedium.copyWith(color: Colors.white),
                ),
              ],
            ),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error sharing link: $e")));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsBottomSheet(
      title: "Invite Member",
      isSubmitting: _isSending,
      onSave: _canInvite ? _handleInvite : null,
      buttonLabel: "Send Invitation",
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Text(
            "Invite people to plan and coordinate your trip together.",
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 13,
            ),
          ),
        ),
        TextInputField(
          label: "Email or Username",
          controller: _inviteController,
          hintText: "Enter email or username",
          onChanged: (val) => setState(() {}),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
          fillColor: AppColors.card,
        ),
        const SizedBox(height: 20),
        TextInputField(
          label: "Share a link",
          controller: _linkController,
          readOnly: true,
          onTap: _copyLink,
          hintText: "Generating Link...",
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
          fillColor: AppColors.card,
          suffixIcon: IconButton(
            onPressed: _copyLink,
            icon: const Icon(
              LucideIcons.copy,
              size: 18,
              color: AppColors.primary,
            ),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
