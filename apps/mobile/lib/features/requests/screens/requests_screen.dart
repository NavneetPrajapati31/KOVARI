import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/common/skeleton.dart';
import '../providers/request_provider.dart';
import '../models/request_model.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            _buildTabs(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [_InterestsList(), _InvitationsList()],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 4, right: 16, top: 16, bottom: 16),
      decoration: const BoxDecoration(),
      child: Row(
        children: [
          _buildBackButton(context),
          const SizedBox(width: 4),
          const Expanded(
            child: Text(
              'Requests',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: Icon(
          LucideIcons.arrowLeft,
          size: 20,
          color: AppColors.foreground,
        ),
      ),
    );
  }

  Widget _buildTabs() {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.md,
        right: AppSpacing.md,
        bottom: AppSpacing.sm,
      ),
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
        ),
        child: TabBar(
          controller: _tabController,
          overlayColor: WidgetStateProperty.all(Colors.transparent),
          splashFactory: NoSplash.splashFactory,
          indicator: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: AppColors.primaryLight,
            border: Border.all(color: AppColors.primary, width: 1),
          ),
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.foreground,
          labelStyle: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
          indicatorSize: TabBarIndicatorSize.tab,
          dividerColor: Colors.transparent,
          tabs: const [
            Tab(text: 'Interests'),
            Tab(text: 'Invitations'),
          ],
        ),
      ),
    );
  }
}

class _InterestsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(interestsProvider);

    return state.when(
      data: (interests) {
        if (interests.isEmpty) {
          return Center(
            child: Text(
              'No travel interests yet.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: interests.length,
          itemBuilder: (context, index) =>
              _InterestCard(interest: interests[index]),
        );
      },
      loading: () => _buildSkeleton(),
      error: (err, stack) => Center(child: Text('Error: $err')),
    );
  }

  Widget _buildSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 5,
      itemBuilder: (context, index) => const _RequestCardSkeleton(),
    );
  }
}

class _InterestCard extends ConsumerStatefulWidget {
  final InterestModel interest;

  const _InterestCard({required this.interest});

  @override
  ConsumerState<_InterestCard> createState() => _InterestCardState();
}

class _InterestCardState extends ConsumerState<_InterestCard> {
  String? _loadingAction;
  bool _isAccepted = false;

  Future<void> _handleAction(String action) async {
    setState(() => _loadingAction = action);
    try {
      final success = await ref
          .read(interestsProvider.notifier)
          .respond(widget.interest.id, action);

      if (mounted) {
        if (success) {
          if (action == 'accept') {
            setState(() {
              _isAccepted = true;
              _loadingAction = null;
            });
          }
        } else {
          setState(() => _loadingAction = null);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to perform action. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingAction = null);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final interest = widget.interest;
    final dateFormatted = DateFormat(
      'MMM d, yyyy',
    ).format(interest.sentAt.toLocal());

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: User Info & Timestamp
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              KovariAvatar(
                imageUrl: interest.senderAvatar,
                size: 40,
                fullName: interest.senderName,
              ),
              const SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            interest.senderName,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          dateFormatted,
                          style: AppTextStyles.label.copyWith(
                            fontSize: 11,
                            color: AppColors.mutedForeground,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '@${interest.senderUsername}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.mutedForeground,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Content: Destination
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'INTERESTED IN TRAVELLING TO',
                style: AppTextStyles.label.copyWith(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.mutedForeground,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                interest.destination,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Actions
          if (_isAccepted)
            PrimaryButton(
              text: "It's a match! Chat now.",
              onPressed: () {
                // Navigate to chat
              },
              height: 36,
            )
          else
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    text: 'Delete',
                    onPressed: () => _handleAction('decline'),
                    isLoading: _loadingAction == 'decline',
                    height: 36,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: PrimaryButton(
                    text: 'Connect',
                    onPressed: () => _handleAction('accept'),
                    isLoading: _loadingAction == 'accept',
                    height: 36,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _InvitationsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(invitationsProvider);

    return state.when(
      data: (invitations) {
        if (invitations.isEmpty) {
          return Center(
            child: Text(
              'No group invitations yet.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: invitations.length,
          itemBuilder: (context, index) =>
              _InvitationCard(invitation: invitations[index]),
        );
      },
      loading: () => _buildSkeleton(),
      error: (err, stack) => Center(child: Text('Error: $err')),
    );
  }

  Widget _buildSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 5,
      itemBuilder: (context, index) => const _RequestCardSkeleton(),
    );
  }
}

class _InvitationCard extends ConsumerStatefulWidget {
  final InvitationModel invitation;

  const _InvitationCard({required this.invitation});

  @override
  ConsumerState<_InvitationCard> createState() => _InvitationCardState();
}

class _InvitationCardState extends ConsumerState<_InvitationCard> {
  String? _loadingAction;
  bool _isAccepted = false;

  Future<void> _handleAction(String action) async {
    setState(() => _loadingAction = action);
    try {
      final success = await ref
          .read(invitationsProvider.notifier)
          .respond(widget.invitation.id, action);

      if (mounted) {
        if (success) {
          if (action == 'accept') {
            setState(() {
              _isAccepted = true;
              _loadingAction = null;
            });
          }
        } else {
          setState(() => _loadingAction = null);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to perform action. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingAction = null);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final invitation = widget.invitation;
    final dateFormatted = DateFormat(
      'MMM d, yyyy',
    ).format(invitation.inviteDate.toLocal());

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Group Info & Timestamp
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              KovariAvatar(
                imageUrl: invitation.groupCoverImage,
                size: 40,
                fullName: invitation.groupName,
              ),
              const SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            invitation.groupName,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          dateFormatted,
                          style: AppTextStyles.label.copyWith(
                            fontSize: 11,
                            color: AppColors.mutedForeground,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Invited by @${invitation.creatorUsername}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.mutedForeground,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Content: Destination
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "LET'S PLAN A TRIP TOGETHER TO",
                style: AppTextStyles.label.copyWith(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.mutedForeground,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                invitation.destination,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Actions
          if (_isAccepted)
            PrimaryButton(
              text: "Accepted! Joining group...",
              onPressed: () {
                // Navigate to group
              },
              height: 36,
            )
          else
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    text: 'Decline',
                    onPressed: () => _handleAction('decline'),
                    isLoading: _loadingAction == 'decline',
                    height: 36,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: PrimaryButton(
                    text: 'Accept',
                    onPressed: () => _handleAction('accept'),
                    isLoading: _loadingAction == 'accept',
                    height: 36,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _RequestCardSkeleton extends StatelessWidget {
  const _RequestCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 185,
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          children: [
            // Header: Avatar + Info
            Row(
              children: [
                const Skeleton.circle(size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Skeleton(width: 100, height: 12),
                      const SizedBox(height: 8),
                      const Skeleton(width: 60, height: 12),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Content
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(width: 100, height: 12),
                SizedBox(height: 8),
                Skeleton(width: double.infinity, height: 12),
              ],
            ),
            const SizedBox(height: 20),
            // Actions
            Row(
              children: [
                Expanded(
                  child: Skeleton(
                    height: 36,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Skeleton(
                    height: 36,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
