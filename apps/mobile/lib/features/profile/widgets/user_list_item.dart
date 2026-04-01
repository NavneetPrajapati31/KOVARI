import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../models/user_connection.dart';

class UserListItem extends StatelessWidget {
  final UserConnection user;
  final String type; // 'followers' or 'following'
  final bool isOwnProfile;
  final VoidCallback? onActionPressed;
  final VoidCallback? onRemovePressed;
  final bool isLoading;

  const UserListItem({
    super.key,
    required this.user,
    required this.type,
    this.isOwnProfile = false,
    this.onActionPressed,
    this.onRemovePressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    // Logic for button label matching the web card
    String buttonLabel = '';
    if (isOwnProfile) {
      if (type == 'followers') {
        buttonLabel = user.isFollowing ? 'Message' : 'Follow Back';
      } else {
        buttonLabel = 'Message';
      }
    } else {
      buttonLabel = user.isFollowing ? 'Message' : 'Follow';
    }

    final isPrimaryAction = !isOwnProfile
        ? !user.isFollowing
        : (type == 'followers'
              ? !user.isFollowing
              : true); // Message is primary in following too

    return Container(
      padding: const EdgeInsets.only(left: 12, right: 12, top: 12, bottom: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: Row(
        children: [
          // Web-Sized Avatar (h-10 w-10 = 40px on mobile)
          KovariAvatar(imageUrl: user.avatar, size: 40),
          const SizedBox(width: 12),

          // User Info (Exact text-xs parity with tighter spacing)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  user.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: Colors.black,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3), // Tight gap matching web
                Text(
                  user.username,
                  style: const TextStyle(
                    color: AppColors.mutedForeground,
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Action Buttons
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildButton(
                label: buttonLabel,
                onPressed: onActionPressed,
                isPrimary: isPrimaryAction,
              ),
              if (isOwnProfile && onRemovePressed != null) ...[
                const SizedBox(width: 6),
                _buildRemoveButton(onRemovePressed!),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required String label,
    VoidCallback? onPressed,
    bool isPrimary = false,
  }) {
    return SizedBox(
      height: 32,
      child: TextButton(
        onPressed: isLoading ? null : onPressed,
        style: TextButton.styleFrom(
          backgroundColor: isPrimary ? AppColors.primary : AppColors.secondary,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.primaryForeground,
                  ),
                ),
              )
            : Text(
                label,
                style: TextStyle(
                  color: isPrimary
                      ? AppColors.primaryForeground
                      : AppColors.secondaryForeground,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
      ),
    );
  }

  Widget _buildRemoveButton(VoidCallback onPressed) {
    return SizedBox(
      width: 32,
      height: 32,
      child: IconButton(
        onPressed: isLoading ? null : onPressed,
        icon: const Icon(LucideIcons.x, size: 18),
        style: IconButton.styleFrom(
          backgroundColor: AppColors.secondary,
          foregroundColor: AppColors.secondaryForeground,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: AppColors.border, width: 1),
          ),
        ),
      ),
    );
  }
}
