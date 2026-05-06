import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mobile/shared/widgets/kovari_refresh_indicator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../models/request_model.dart';
import '../providers/request_provider.dart';

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface(context),
      appBar: AppBar(title: const Text('Requests')),
      body: _ReceivedRequestsTab(),
    );
  }
}

class _ReceivedRequestsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface(context, level: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              indicator: BoxDecoration(
                color: AppColors.surface(context, level: 3),
                borderRadius: BorderRadius.circular(12),
              ),
              labelColor: AppColors.text(context),
              unselectedLabelColor: AppColors.text(context, isMuted: true),
              dividerColor: Colors.transparent,
              indicatorSize: TabBarIndicatorSize.tab,
              tabs: const [
                Tab(text: 'Interests'),
                Tab(text: 'Invitations'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(children: [_InterestsList(), _InvitationsList()]),
          ),
        ],
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
          return KovariRefreshIndicator(
            onRefresh: () => ref.read(interestsProvider.notifier).refresh(),
            child: CustomScrollView(
              slivers: [
                SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'No travel interests yet.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.text(context, isMuted: true),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }
        return KovariRefreshIndicator(
          onRefresh: () => ref.read(interestsProvider.notifier).refresh(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.md),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) =>
                        _InterestCard(interest: interests[index]),
                    childCount: interests.length,
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => _buildSkeleton(context),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: TextStyle(color: AppColors.text(context)),
        ),
      ),
    );
  }

  Widget _buildSkeleton(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 5,
      itemBuilder: (context, index) => _RequestCardSkeleton(context),
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
        color: AppColors.surface(context, level: 1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderColor(context)),
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
                              color: AppColors.text(context),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          dateFormatted,
                          style: AppTextStyles.label.copyWith(
                            fontSize: 11,
                            color: AppColors.text(context, isMuted: true),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '@${interest.senderUsername}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.text(context, isMuted: true),
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
                  color: AppColors.text(context, isMuted: true),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                interest.destination,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: AppColors.text(context),
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
          return KovariRefreshIndicator(
            onRefresh: () => ref.read(invitationsProvider.notifier).refresh(),
            child: CustomScrollView(
              slivers: [
                SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'No group invitations yet.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.text(context, isMuted: true),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }
        return KovariRefreshIndicator(
          onRefresh: () => ref.read(invitationsProvider.notifier).refresh(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.md),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) =>
                        _InvitationCard(invitation: invitations[index]),
                    childCount: invitations.length,
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => _buildSkeleton(context),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: TextStyle(color: AppColors.text(context)),
        ),
      ),
    );
  }

  Widget _buildSkeleton(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 5,
      itemBuilder: (context, index) => _RequestCardSkeleton(context),
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

  Future<void> _handleAction(String action) async {
    setState(() => _loadingAction = action);
    try {
      final success = await ref
          .read(invitationsProvider.notifier)
          .respond(widget.invitation.id, action);

      if (mounted) {
        if (!success) {
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
        color: AppColors.surface(context, level: 1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderColor(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
                              color: AppColors.text(context),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          dateFormatted,
                          style: AppTextStyles.label.copyWith(
                            fontSize: 11,
                            color: AppColors.text(context, isMuted: true),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Invited by ${invitation.creatorName}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.text(context, isMuted: true),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
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
                  text: 'Join Group',
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
  final BuildContext context;
  const _RequestCardSkeleton(this.context);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface(context, level: 1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderColor(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: Colors.black12,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(height: 12, width: 100, color: Colors.black12),
                    const SizedBox(height: 6),
                    Container(height: 10, width: 60, color: Colors.black12),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(height: 12, width: double.infinity, color: Colors.black12),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: Container(height: 36, color: Colors.black12)),
              const SizedBox(width: 8),
              Expanded(child: Container(height: 36, color: Colors.black12)),
            ],
          ),
        ],
      ),
    );
  }
}
