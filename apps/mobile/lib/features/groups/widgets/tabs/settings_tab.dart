import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/group.dart';
import '../../providers/group_details_provider.dart';

class SettingsTab extends ConsumerWidget {
  final Group group;
  final VoidCallback onViewMembers;

  const SettingsTab({
    super.key,
    required this.group,
    required this.onViewMembers,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membershipAsync = ref.watch(groupMembershipProvider(group.id));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSettingsSection("Group Info", [
          _buildSettingsItem(
            icon: LucideIcons.info,
            title: "Edit Basic Details",
            subtitle: "Name, description, destination",
            onTap: () {},
          ),
          _buildSettingsItem(
            icon: LucideIcons.calendar,
            title: "Travel Dates",
            subtitle: group.dateRange.start != null
                ? "${DateFormat('MMM d').format(DateTime.parse(group.dateRange.start!))} - ${group.dateRange.end != null ? DateFormat('MMM d').format(DateTime.parse(group.dateRange.end!)) : 'Ongoing'}"
                : "Not set",
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 24),
        _buildSettingsSection("Management", [
          _buildSettingsItem(
            icon: LucideIcons.users,
            title: "Manage Members",
            subtitle: "Add, remove, or change roles",
            onTap: onViewMembers,
          ),
          _buildSettingsItem(
            icon: LucideIcons.shieldCheck,
            title: "Privacy & Safety",
            subtitle: group.privacy == 'public'
                ? "Public Group"
                : "Private Group",
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 24),
        _buildSettingsSection("Actions", [
          _buildSettingsItem(
            icon: LucideIcons.logOut,
            title: "Leave Group",
            titleColor: AppColors.destructive,
            onTap: () => _showLeaveConfirmation(context, ref),
          ),
          if (membershipAsync.value?.isCreator == true)
            _buildSettingsItem(
              icon: LucideIcons.trash2,
              title: "Delete Group",
              titleColor: AppColors.destructive,
              onTap: () => _showDeleteConfirmation(context, ref),
            ),
        ]),
      ],
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.mutedForeground,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    String? subtitle,
    Color? titleColor,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, size: 20, color: titleColor ?? AppColors.foreground),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: titleColor ?? AppColors.foreground,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.mutedForeground,
              ),
            )
          : null,
      trailing: const Icon(
        LucideIcons.chevronRight,
        size: 16,
        color: AppColors.muted,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    );
  }

  void _showLeaveConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Leave Group?"),
        content: const Text(
          "Are you sure you want to leave this travel group?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              ref.read(groupActionsProvider(group.id)).leaveGroup();
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text(
              "Leave",
              style: TextStyle(color: AppColors.destructive),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Group?"),
        content: const Text(
          "This action is permanent and will delete all trip data and chats for everyone.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              ref.read(groupActionsProvider(group.id)).deleteGroup();
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text(
              "Delete",
              style: TextStyle(color: AppColors.destructive),
            ),
          ),
        ],
      ),
    );
  }
}
