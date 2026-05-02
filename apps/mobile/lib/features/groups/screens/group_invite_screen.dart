import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/common/kovari_image.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/utils/url_utils.dart';
import '../providers/group_details_provider.dart';
import '../providers/group_provider.dart';
import '../../../core/providers/auth_provider.dart';
import 'group_details_screen.dart';
import '../../auth/screens/login_screen.dart';

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
    // 1. Auth Guard: Only proceed if logged in
    final user = ref.read(authStateProvider);
    if (user == null) {
      _isLoading = false;
      _error = "auth_required";

      // Directly redirect to Login and remove this screen from stack
      // so they return to Dashboard/Home after login.
      Future.microtask(() {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
      });
    } else {
      _fetchInviteInfo();
    }
  }

  Future<void> _fetchInviteInfo() async {
    try {
      final service = ref.read(groupServiceProvider);
      final response = await service.getInviteInfo(widget.token);

      if (mounted) {
        // 2. Membership Guard: If already a member, skip invite
        if (response['isMember'] == true) {
          final groupId = response['id'] as String;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => GroupDetailsScreen(groupId: groupId),
            ),
          );
          return;
        }

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
    print("Join Group initiated...");
    if (_groupInfo == null) {
      print("Error: _groupInfo is null");
      return;
    }
    setState(() => _isJoining = true);
    try {
      final groupId = _groupInfo!['id'] as String;
      print("Joining Group ID: $groupId");
      await ref.read(groupActionsProvider(groupId)).joinViaInvite();
      print("Join Successful!");

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Welcome to the group!")));
        // Replace current screen with group details
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => GroupDetailsScreen(groupId: groupId),
          ),
        );
      }
    } catch (e) {
      print("Join Error: $e");
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
        setState(() => _isJoining = false);
      }
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
          if (fullImageUrl != null)
            Positioned.fill(
              child: Opacity(
                opacity: 0.4,
                child: KovariImage(
                  imageUrl: fullImageUrl,
                  fit: BoxFit.cover,
                  fadeInDuration: const Duration(milliseconds: 500),
                  fadeOutDuration: const Duration(milliseconds: 500),
                  placeholder: Container(color: Colors.white.withOpacity(0.05)),
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
                    Colors.black.withValues(alpha: 0.1),
                    Colors.black.withValues(alpha: 0.8),
                    Colors.black,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(
                          LucideIcons.x,
                          size: 20,
                          color: Colors.white,
                        ),
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
                      const SizedBox(width: 48),
                    ],
                  ),
                ),

                Expanded(
                  child: _isLoading
                      ? const Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            ),
                          ),
                        )
                      : _error != null
                      ? _buildErrorState()
                      : _buildInviteContent(),
                ),

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
      padding: const EdgeInsets.fromLTRB(32, 22, 32, 22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
        ),
      ),
      child: PrimaryButton(
        text: "Join Group",
        onPressed: _handleJoin,
        isLoading: _isJoining,
        height: 48,
      ),
    );
  }

  Widget _buildErrorState() {
    final isAuthError = _error == "auth_required";

    if (isAuthError) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: const EdgeInsets.fromLTRB(28, 48, 28, 40),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: Colors.white.withOpacity(0.12)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withOpacity(0.08),
                        ),
                      ),
                      child: const Icon(
                        LucideIcons.lock,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 32),
                    Text(
                      "Authentication Required",
                      textAlign: TextAlign.center,
                      style: AppTextStyles.h2.copyWith(
                        color: Colors.white,
                        fontSize: 24,
                        letterSpacing: -0.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "This group is private. You need to log in to view and join this journey.",
                      textAlign: TextAlign.center,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: Colors.white.withOpacity(0.5),
                        height: 1.5,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 48),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const LoginScreen(),
                          ),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.white.withOpacity(0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          "Login to access",
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.2,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        "Go Back",
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

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

  Widget _buildSocialProof() {
    final avatars = List<String>.from(_groupInfo?['memberAvatars'] ?? []);
    final count = _groupInfo?['memberCount'] ?? 0;

    if (count == 0) return const SizedBox.shrink();

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (avatars.isNotEmpty)
          SizedBox(
            width: (avatars.length * 16.0) + 24,
            height: 32,
            child: Stack(
              children: avatars.asMap().entries.map((entry) {
                final index = entry.key;
                final url = entry.value;

                return Positioned(
                  left: index * 16.0,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                    child: KovariAvatar(imageUrl: url, size: 24),
                  ),
                );
              }).toList(),
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
            const SizedBox(height: 30),
            // Hero Image
            Container(
              width: 85,
              height: 85,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
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
                    ? KovariImage(
                        imageUrl: fullImageUrl,
                        width: 85,
                        height: 85,
                        fit: BoxFit.cover,
                        fadeInDuration: const Duration(milliseconds: 500),
                        fadeOutDuration: const Duration(milliseconds: 500),
                        placeholder: Container(
                          color: Colors.white.withOpacity(0.1),
                        ),
                      )
                    : KovariAvatar(imageUrl: null, size: 85, fullName: name),
              ),
            ),
            // Labels
            const SizedBox(height: 10),
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
            const SizedBox(height: 12),
            // Destination Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    LucideIcons.mapPin,
                    size: 13,
                    color: Colors.white.withOpacity(0.85),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    destination,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Social Proof
            _buildSocialProof(),

            // Description
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        "ABOUT",
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.4),
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
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
            // Trip Highlights
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "GROUP FEATURES",
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.4),
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildHighlightItem(
                    LucideIcons.messageSquare,
                    "Group Chat",
                    "Real-time coordination with members",
                  ),
                  const SizedBox(height: 12),
                  _buildHighlightItem(
                    LucideIcons.calendarDays,
                    "Collaborative Itinerary",
                    "Plan activities together",
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            _buildInviterCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildInviterCard() {
    final inviter = _groupInfo?['inviter'];
    if (inviter == null) return const SizedBox.shrink();

    final name = inviter['name'] ?? "A Traveler";
    final username = inviter['username'] ?? "traveler";
    final avatar = inviter['avatar'];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "INVITED BY",
            style: TextStyle(
              color: Colors.white.withOpacity(0.4),
              fontWeight: FontWeight.w800,
              fontSize: 11,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              KovariAvatar(
                imageUrl: UrlUtils.getFullImageUrl(avatar),
                size: 38,
                fullName: name,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      "@$username",
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHighlightItem(IconData icon, String title, String subtitle) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 15, color: Colors.white.withOpacity(0.7)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
