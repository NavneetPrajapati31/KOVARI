import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/url_utils.dart';
import '../providers/group_details_provider.dart';
import '../providers/group_provider.dart';

class GroupInviteScreen extends ConsumerStatefulWidget {
  final String token;
  const GroupInviteScreen({super.key, required this.token});

  @override
  ConsumerState<GroupInviteScreen> createState() => _GroupInviteScreenState();
}

class _GroupInviteScreenState extends ConsumerState<GroupInviteScreen> {
  bool _isLoading = true;
  bool _isJoining = false;
  Map<String, dynamic>? _groupInfo;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchInviteInfo();
  }

  Future<void> _fetchInviteInfo() async {
    try {
      final service = ref.read(groupServiceProvider);
      // We need a way to call the endpoint from GroupService
      // I'll add getInviteInfo to GroupService in next step if missing
      final response = await service.getInviteInfo(widget.token);
      if (mounted) {
        setState(() {
          _groupInfo = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleJoin() async {
    if (_groupInfo == null) return;
    setState(() => _isJoining = true);
    try {
      final groupId = _groupInfo!['id'] as String;
      await ref.read(groupActionsProvider(groupId)).joinViaInvite();

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Welcome to the group!")));
        Navigator.pop(context);
        // Optionally navigate to group details
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final coverImage = _groupInfo?['coverImage'];
    final fullImageUrl = UrlUtils.getFullImageUrl(coverImage);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Immersive Blurred Background
          if (fullImageUrl != null)
            Positioned.fill(
              child: Opacity(
                opacity: 0.4,
                child: CachedNetworkImage(
                  imageUrl: fullImageUrl,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.1),
                    Colors.black.withOpacity(0.8),
                    Colors.black,
                  ],
                ),
              ),
            ),
          ),

          // 2. Main Content
          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(LucideIcons.x, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const Spacer(),
                      Text(
                        "Invitation",
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(width: 48), // Padding balance
                    ],
                  ),
                ),

                Expanded(
                  child: _isLoading
                      ? const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        )
                      : _error != null
                      ? _buildErrorState()
                      : _buildInviteContent(),
                ),

                // Bottom Action
                if (!_isLoading && _error == null) _buildActionButton(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton() {
    return Container(
      padding: const EdgeInsets.fromLTRB(32, 16, 32, 32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
        ),
      ),
      child: Container(
        width: double.infinity,
        height: 48,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: _isJoining ? null : _handleJoin,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
            elevation: 0,
          ),
          child: _isJoining
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text(
                  "Join Group",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(32),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              LucideIcons.circleAlert,
              color: Colors.blueAccent,
              size: 48,
            ),
            const SizedBox(height: 20),
            Text(
              "Invalid Link",
              style: AppTextStyles.h2.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 12),
            Text(
              "This invitation has expired or been revoked.",
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMedium.copyWith(
                color: Colors.white.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 32),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                "Go Back",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder(String name) {
    return Container(
      color: Colors.blueAccent.withOpacity(0.2),
      child: Center(
        child: Text(
          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : "?",
          style: AppTextStyles.h1.copyWith(
            color: Colors.blueAccent,
            fontSize: 48,
          ),
        ),
      ),
    );
  }

  Widget _buildSocialProof() {
    final avatars = List<String>.from(_groupInfo?['memberAvatars'] ?? []);
    final count = _groupInfo?['memberCount'] ?? 0;

    if (count == 0) return const SizedBox.shrink();

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (avatars.isNotEmpty)
          SizedBox(
            width: (avatars.length * 20.0) + 10,
            height: 32,
            child: Stack(
              children: List.generate(avatars.length, (index) {
                return Positioned(
                  left: index * 20.0,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                    child: CircleAvatar(
                      radius: 14,
                      backgroundColor: Colors.grey[900],
                      backgroundImage: CachedNetworkImageProvider(
                        UrlUtils.getFullImageUrl(avatars[index]) ?? '',
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        const SizedBox(width: 8),
        Text(
          "$count ${count == 1 ? 'member' : 'members'} already exploring",
          style: AppTextStyles.bodyMedium.copyWith(
            color: Colors.white.withOpacity(0.7),
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildInviteContent() {
    final name = _groupInfo?['name'] ?? "Trip Group";
    final destination = _groupInfo?['destination'] ?? "World";
    final rawDescription = _groupInfo?['description'];
    final description =
        (rawDescription != null && rawDescription.toString().trim().isNotEmpty)
        ? rawDescription.toString()
        : "Join us in exploring $destination! This trip is all about creating memories, discovering new places, and enjoying the journey together with amazing people.";
    final coverImage = _groupInfo?['coverImage'];
    final fullImageUrl = UrlUtils.getFullImageUrl(coverImage);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          children: [
            const SizedBox(height: 40),
            // Hero Image
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    spreadRadius: 2,
                    blurRadius: 30,
                  ),
                ],
              ),
              child: ClipOval(
                child: fullImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: fullImageUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) =>
                            Container(color: Colors.white.withOpacity(0.1)),
                        errorWidget: (context, url, e) =>
                            _buildPlaceholder(name),
                      )
                    : _buildPlaceholder(name),
              ),
            ),
            const SizedBox(height: 24),
            // Labels
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Text(
                "GROUP INVITATION",
                style: AppTextStyles.bodySmall.copyWith(
                  color: Colors.white.withOpacity(0.8),
                  fontWeight: FontWeight.w800,
                  letterSpacing: 2.0,
                  fontSize: 10,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              name,
              style: AppTextStyles.h1.copyWith(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            // Destination Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    LucideIcons.mapPin,
                    size: 14,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    destination,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Social Proof
            _buildSocialProof(),

            const SizedBox(height: 24),
            // Description
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        LucideIcons.info,
                        size: 16,
                        color: Colors.white.withOpacity(0.5),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "ABOUT THIS TRIP",
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.4),
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    description,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.white.withOpacity(0.85),
                      height: 1.4,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
