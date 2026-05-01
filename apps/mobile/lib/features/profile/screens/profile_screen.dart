import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../shared/utils/url_utils.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../models/user_profile.dart';
import '../../app_shell/providers/app_shell_provider.dart';
import 'connections_screen.dart';
import 'edit_profile_screen.dart';
import 'settings_screen.dart';
import 'safety_screen.dart';

import '../../../shared/widgets/kovari_image_modal.dart';
import '../../../shared/widgets/kovari_popover.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);

    if (profile == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                child: Column(
                  children: [
                    _buildHeaderCard(context, ref, profile),
                    const SizedBox(height: 12),
                    _buildContentCard(profile),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard(
    BuildContext context,
    WidgetRef ref,
    UserProfile profile,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () {
                  if (profile.profileImage.isNotEmpty) {
                    KovariImageModal.show(
                      context,
                      UrlUtils.getFullImageUrl(profile.profileImage)!,
                    );
                  }
                },
                child: KovariAvatar(
                  imageUrl: UrlUtils.getFullImageUrl(profile.profileImage),
                  size: 65,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            profile.name,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        KovariPopover(
                          items: [
                            KovariMenuAction(
                              icon: LucideIcons.settings,
                              label: 'Settings',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const SettingsScreen(),
                                  ),
                                );
                              },
                            ),
                            KovariMenuAction(
                              icon: LucideIcons.shieldCheck,
                              label: 'Safety',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const SafetyScreen(),
                                  ),
                                );
                              },
                            ),
                            KovariMenuAction(
                              icon: LucideIcons.logOut,
                              label: 'Log out',
                              isDestructive: true,
                              onTap: () =>
                                  ref.read(authProvider.notifier).logout(),
                            ),
                          ],
                          child: const Icon(
                            LucideIcons.menu,
                            size: 18,
                            color: AppColors.foreground,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '@${profile.username}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.mutedForeground,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStatItem(
                          profile.followers,
                          'Followers',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ConnectionsScreen(
                                  userId: profile.userId,
                                  username: profile.username,
                                  initialTab: 'followers',
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 16),
                        _buildStatItem(
                          profile.following,
                          'Following',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ConnectionsScreen(
                                  userId: profile.userId,
                                  username: profile.username,
                                  initialTab: 'following',
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            profile.bio.isEmpty ? 'No bio added.' : profile.bio,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Edit Profile',
                  onPressed: () {
                    Navigator.push(
                      context,
                      PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) =>
                            EditProfileScreen(profile: profile),
                        transitionsBuilder:
                            (context, animation, secondaryAnimation, child) {
                              const begin = Offset(0.0, 1.0);
                              const end = Offset.zero;
                              const curve = Curves.easeOutCubic;
                              var tween = Tween(
                                begin: begin,
                                end: end,
                              ).chain(CurveTween(curve: curve));
                              return SlideTransition(
                                position: animation.drive(tween),
                                child: child,
                              );
                            },
                        fullscreenDialog: true,
                      ),
                    );
                  },
                  backgroundColor: AppColors.primary,
                  textColor: AppColors.primaryForeground,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionButton(
                  'Explore',
                  onPressed: () {
                    // Navigate to the Explore tab (index 1)
                    ref.read(appShellIndexProvider.notifier).setIndex(1);
                  },
                  backgroundColor: AppColors.secondary,
                  textColor: AppColors.secondaryForeground,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget safeAreas({required Widget child}) {
    return Material(
      color: Colors.transparent,
      child: SafeArea(child: child),
    );
  }

  Widget _buildStatItem(String count, String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          Text(
            count,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: Colors.black,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    String label, {
    required VoidCallback onPressed,
    required Color backgroundColor,
    required Color textColor,
  }) {
    return SizedBox(
      height: 32, // Controlled height for "sm" button
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          backgroundColor: backgroundColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildContentCard(UserProfile profile) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.lg,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 50,
            child: const Text(
              'About',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 50,
            height: 2,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(1),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          // First section: 3 rows
          _buildInfoRow(
            _buildInfoItem(
              'AGE',
              profile.age.isEmpty ? 'Not specified' : profile.age,
            ),
            _buildInfoItem(
              'GENDER',
              profile.gender.isEmpty ? 'Not specified' : profile.gender,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            _buildInfoItem(
              'NATIONALITY',
              profile.nationality.isEmpty
                  ? 'Not specified'
                  : profile.nationality,
            ),
            _buildInfoItem(
              'LOCATION',
              profile.location.isEmpty ? 'Not specified' : profile.location,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            _buildInfoItem(
              'PROFESSION',
              profile.profession.isEmpty ? 'Not specified' : profile.profession,
            ),
            _buildInfoItem(
              'RELIGION',
              profile.religion.isEmpty ? 'Not specified' : profile.religion,
            ),
          ),
          const SizedBox(height: 20),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 20),
          // Second section: 2 rows
          _buildInfoRow(
            _buildInfoItem(
              'PERSONALITY',
              profile.personality.isEmpty
                  ? 'Not specified'
                  : profile.personality,
            ),
            _buildInfoItem(
              'FOOD PREFERENCE',
              profile.foodPreference.isEmpty
                  ? 'Not specified'
                  : profile.foodPreference,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            _buildInfoItem(
              'SMOKING',
              profile.smoking.isEmpty ? 'Not specified' : profile.smoking,
            ),
            _buildInfoItem(
              'DRINKING',
              profile.drinking.isEmpty ? 'Not specified' : profile.drinking,
            ),
          ),
          if (profile.interests.isNotEmpty || profile.languages.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: 20),
            if (profile.interests.isNotEmpty) ...[
              _buildChipsSection('INTERESTS', profile.interests),
              if (profile.languages.isNotEmpty) const SizedBox(height: 20),
            ],
            if (profile.languages.isNotEmpty) ...[
              _buildChipsSection('LANGUAGES', profile.languages),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.mutedForeground,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(Widget item1, Widget item2) {
    return Row(
      children: [
        Expanded(child: item1),
        const SizedBox(width: 16),
        Expanded(child: item2),
      ],
    );
  }

  Widget _buildChipsSection(String label, List<String> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.mutedForeground,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: items.map((item) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.black,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
