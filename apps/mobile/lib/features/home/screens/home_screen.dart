import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/home_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../widgets/header/home_header.dart';
import '../widgets/cards/top_destination_card.dart';
import '../widgets/cards/upcoming_trip_card.dart';
import '../widgets/cards/stat_card.dart';
import '../widgets/sections/groups_section.dart';
import '../widgets/sections/requests_section.dart';
import '../widgets/sections/itinerary_section.dart';
import '../providers/home_provider.dart';
import '../../app_shell/providers/app_shell_provider.dart';
import '../../../core/widgets/skeletons/kovari_skeletons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/widgets/kovari_refresh_indicator.dart';
import '../../../shared/widgets/kovari_empty_state.dart';
import '../../../shared/utils/scroll_preloader.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  Future<void> _handleRefresh() async {
    await ref.read(homeDataProvider.notifier).refresh();
  }

  void _handleExploreUpcomingTrip(String? groupId) {
    ref.read(appShellIndexProvider.notifier).setIndex(3);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final homeState = ref.watch(homeDataProvider);

    // Pre-cache Side Effects
    if (homeState.data != null) {
      final data = homeState.data!;
      if (data.topDestination?.imageUrl != null &&
          data.topDestination!.imageUrl!.isNotEmpty) {
        precacheImage(
          CachedNetworkImageProvider(data.topDestination!.imageUrl!),
          context,
        );
      }
      if (data.profile.avatar.isNotEmpty) {
        precacheImage(CachedNetworkImageProvider(data.profile.avatar), context);
      }
    }

    return Material(
      color: AppColors.surface(context),
      child: SafeArea(
        child: ScrollPreloader(
          onIdle: () {
            if (homeState.data != null) {
              ref.read(homeDataProvider.notifier).refresh(isSilent: true);
            }
          },
          child: KovariRefreshIndicator(
            onRefresh: _handleRefresh,
            child: CustomScrollView(
              key: const PageStorageKey('home_scroll'),
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // 1. Stale Indicator (Subtle)
                if (homeState.isStale)
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 2,
                      child: LinearProgressIndicator(
                        backgroundColor: Colors.transparent,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.primary.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                  ),

                // 2. Header
                SliverPadding(
                  padding: const EdgeInsets.only(
                    left: AppSpacing.md,
                    right: AppSpacing.md,
                    top: AppSpacing.md,
                    bottom: AppSpacing.sm,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: HomeHeader(
                      firstName:
                          homeState.data?.profile.name.split(' ')[0] ?? 'User',
                      isLoading: homeState.isLoading && homeState.data == null,
                    ),
                  ),
                ),

                // 3. Body Content
                SliverPadding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                  ),
                  sliver: _buildSliverBody(homeState),
                ),

                const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.xl),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSliverBody(HomeState state) {
    if (state.isLoading && state.data == null) {
      return SliverList(
        delegate: SliverChildListDelegate([
          const SkeletonCard(height: 200),
          const SizedBox(height: AppSpacing.md),
          const SkeletonCard(height: 180),
          const SizedBox(height: AppSpacing.md),
          const SkeletonListTile(),
          const SkeletonListTile(),
        ]),
      );
    }

    if (state.error != null && state.data == null) {
      return SliverFillRemaining(
        child: KovariEmptyState(
          title: 'Something went wrong',
          description: state.error!,
          icon: Icons.error_outline,
          actionLabel: 'Try Again',
          onAction: _handleRefresh,
        ),
      );
    }

    final data = state.data!;

    // Convert data for sections
    final mockGroups = data.activeGroups
        .map<MockGroup>(
          (g) => MockGroup(
            id: g.id,
            name: g.name,
            destination: g.destination ?? '',
            members: g.members,
            imageUrl: g.coverImage,
          ),
        )
        .toList();

    final mockEvents =
        data.featuredTrip?.itinerary
            .map<MockEvent>(
              (i) => MockEvent(
                id: i.id,
                title: i.title,
                description: i.description,
                start: DateTime.tryParse(i.datetime ?? '') ?? DateTime.now(),
                end: (DateTime.tryParse(i.datetime ?? '') ?? DateTime.now())
                    .add(const Duration(hours: 1)),
              ),
            )
            .toList() ??
        [];

    return SliverList(
      delegate: SliverChildListDelegate([
        // Top Destination
        TopDestinationCard(
          name: data.topDestination?.name ?? '',
          imageUrl: data.topDestination?.imageUrl,
          isLoading: false,
        ),
        const SizedBox(height: AppSpacing.mds),

        // Upcoming Trip
        UpcomingTripCard(
          name: data.featuredTrip?.name ?? '',
          groupId: data.featuredTrip?.id,
          imageUrl: data.featuredTrip?.coverImage,
          onExplore: () => _handleExploreUpcomingTrip(data.featuredTrip?.id),
          isLoading: false,
        ),
        const SizedBox(height: AppSpacing.mds),

        // Stats
        StatCard(
          title: 'Total Travel Days',
          value: data.stats.travelDaysDisplay,
        ),
        const SizedBox(height: AppSpacing.mds),
        StatCard(
          title: 'Profile Impressions',
          value: data.stats.impressionsDisplay,
        ),
        const SizedBox(height: AppSpacing.mds),

        // Sections
        RepaintBoundary(
          child: GroupsSection(groups: mockGroups, isLoading: false),
        ),
        const SizedBox(height: AppSpacing.md),
        const RepaintBoundary(child: RequestsSection(isLoading: false)),
        const SizedBox(height: AppSpacing.md),
        RepaintBoundary(
          child: ItinerarySection(events: mockEvents, isLoading: false),
        ),
      ]),
    );
  }
}
