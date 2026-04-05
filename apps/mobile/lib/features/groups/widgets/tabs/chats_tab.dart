import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/group.dart';

class ChatsTab extends StatelessWidget {
  final Group group;

  const ChatsTab({super.key, required this.group});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.messageCircle,
              size: 48,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            "Group Chat",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Connect with your travel buddies here.",
            style: TextStyle(color: AppColors.mutedForeground, fontSize: 14),
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            text: "Open Chat",
            onPressed: () {
              // Navigation to chat screen would go here
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Chat feature integration coming soon!"),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
