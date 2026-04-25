import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/utils/url_utils.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/kovari_image_modal.dart';
import '../../onboarding/data/profile_service.dart';
import '../models/user_profile.dart';
import '../data/connections_service.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../shared/widgets/kovari_confirm_dialog.dart';
import 'connections_screen.dart';

class PublicProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<PublicProfileScreen> createState() =>
      _PublicProfileScreenState();
}

class _PublicProfileScreenState extends ConsumerState<PublicProfileScreen> {
  UserProfile? _profile;
  bool _isLoading = true;
  String? _error;
  late ProfileService _profileService;
  late ConnectionsService _connectionsService;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClientFactory.create();
    _profileService = ProfileService(apiClient);
    _connectionsService = ConnectionsService(apiClient);
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final profileData = await _profileService.getProfileById(widget.userId);
      if (profileData != null) {
        setState(() {
          _profile = UserProfile.fromJson(profileData);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'User not found';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleFollow() async {
    if (_profile == null) return;

    final wasFollowing = _profile!.isFollowing;

    if (wasFollowing) {
      // Show confirmation dialog for unfollowing
      showKovariConfirmDialog(
        context: context,
        title: 'Unfollow?',
        content:
            'Kovari won\'t tell @${_profile!.username} they were unfollowed.',
        confirmLabel: 'Unfollow',
        isDestructive: true,
        onConfirm: () => _executeFollowToggle(wasFollowing),
      );
    } else {
      _executeFollowToggle(wasFollowing);
    }
  }

  Future<void> _executeFollowToggle(bool wasFollowing) async {
    // Optimistic update
    setState(() {
      _profile = _profile!.copyWith(
        isFollowing: !wasFollowing,
        followers: (int.parse(_profile!.followers) + (wasFollowing ? -1 : 1))
            .toString(),
      );
    });

    try {
      if (wasFollowing) {
        await _connectionsService.unfollowUser(widget.userId);
      } else {
        await _connectionsService.followUser(widget.userId);
      }
    } catch (e) {
      // Revert on error
      setState(() {
        _profile = _profile!.copyWith(
          isFollowing: wasFollowing,
          followers: (int.parse(_profile!.followers) + (wasFollowing ? 1 : -1))
              .toString(),
        );
      });
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = ref.watch(profileProvider)?.userId;
    final bool isMe = widget.userId == currentUserId;

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: SizedBox(
            height: 24,
            width: 24,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
        ),
      );
    }

    if (_error != null || _profile == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(
              LucideIcons.arrowLeft,
              color: AppColors.foreground,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error ?? 'User not found'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchProfile,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(
            LucideIcons.arrowLeft,
            color: AppColors.foreground,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _profile!.username,
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
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
                    _buildHeaderCard(context, _profile!, isMe),
                    const SizedBox(height: 12),
                    _buildContentCard(_profile!),
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
    UserProfile profile,
    bool isMe,
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
                    Text(
                      profile.name,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
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
                          onTap: profile.isOwnProfile
                              ? () {
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
                                }
                              : null,
                        ),
                        const SizedBox(width: 16),
                        _buildStatItem(
                          profile.following,
                          'Following',
                          onTap: profile.isOwnProfile
                              ? () {
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
                                }
                              : null,
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
          if (!isMe) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: _buildActionButton(
                    profile.isFollowing
                        ? 'Following'
                        : (profile.isFollowingMe ? 'Follow Back' : 'Follow'),
                    onPressed: _toggleFollow,
                    backgroundColor: profile.isFollowing
                        ? AppColors.secondary
                        : AppColors.primary,
                    textColor: profile.isFollowing
                        ? AppColors.secondaryForeground
                        : AppColors.primaryForeground,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildActionButton(
                    'Message',
                    onPressed: () {
                      // TODO: Implement message navigation
                    },
                    backgroundColor: AppColors.secondary,
                    textColor: AppColors.secondaryForeground,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
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
      height: 36,
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
            fontSize: 13,
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
