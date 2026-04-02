import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../providers/request_provider.dart';
import '../models/request_model.dart';

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
        child: const Icon(
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
          tabs: [
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
      itemBuilder: (context, index) => Container(
        height: 200,
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
      ),
    );
  }
}

class _InterestCard extends ConsumerWidget {
  final InterestModel interest;

  const _InterestCard({required this.interest});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage: interest.senderAvatar.isNotEmpty
                      ? NetworkImage(interest.senderAvatar)
                      : null,
                  backgroundColor: AppColors.secondary,
                  child: interest.senderAvatar.isEmpty
                      ? Text(
                          interest.senderName[0],
                          style: AppTextStyles.h3.copyWith(fontSize: 14),
                        )
                      : null,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        interest.senderName,
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '@${interest.senderUsername}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    interest.mutualConnections > 0
                        ? '${interest.mutualConnections} mutual'
                        : 'New traveler',
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Text(
              'Interested in traveling with you to ${interest.destination}',
              style: AppTextStyles.bodyMedium,
            ),
          ),
          if (interest.senderBio.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Text(
                interest.senderBio,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.mutedForeground,
                ),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          const Divider(height: 1),
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => ref
                      .read(interestsProvider.notifier)
                      .respond(interest.id, 'decline'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Pass',
                    style: TextStyle(
                      color: AppColors.mutedForeground,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.border),
              Expanded(
                child: TextButton(
                  onPressed: () => ref
                      .read(interestsProvider.notifier)
                      .respond(interest.id, 'accept'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Accept',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
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
      itemBuilder: (context, index) => Container(
        height: 250,
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
      ),
    );
  }
}

class _InvitationCard extends ConsumerWidget {
  final InvitationModel invitation;

  const _InvitationCard({required this.invitation});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (invitation.groupCoverImage != null)
            Image.network(
              invitation.groupCoverImage!,
              height: 120,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        invitation.groupName,
                        style: AppTextStyles.h3.copyWith(fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '${invitation.expiresInDays}d left',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.destructive,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 14,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      invitation.destination,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
                if (invitation.dates != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 14,
                        color: AppColors.mutedForeground,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        invitation.dates!,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundImage: invitation.creatorAvatar.isNotEmpty
                          ? NetworkImage(invitation.creatorAvatar)
                          : null,
                      backgroundColor: AppColors.secondary,
                      child: invitation.creatorAvatar.isEmpty
                          ? Text(
                              invitation.creatorName[0],
                              style: const TextStyle(fontSize: 10),
                            )
                          : null,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Organized by ',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                    ),
                    Text(
                      invitation.creatorName,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => ref
                      .read(invitationsProvider.notifier)
                      .respond(invitation.id, 'decline'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Decline',
                    style: TextStyle(
                      color: AppColors.mutedForeground,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.border),
              Expanded(
                child: TextButton(
                  onPressed: () => ref
                      .read(invitationsProvider.notifier)
                      .respond(invitation.id, 'accept'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Accept',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
