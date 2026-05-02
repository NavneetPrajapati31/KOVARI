import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/home/models/home_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../widgets/header/home_header.dart';
import '../widgets/cards/top_destination_card.dart';
import '../widgets/cards/upcoming_trip_card.dart';
import '../widgets/cards/stat_card.dart';
import '../widgets/sections/groups_section.dart';
import '../widgets/sections/requests_section.dart';
import '../widgets/sections/itinerary_section.dart';
import '../models/home_data.dart';
import '../providers/home_provider.dart';
import '../../app_shell/providers/app_shell_provider.dart';
import '../../../core/widgets/skeletons/kovari_skeletons.dart';
import 'package:cached_network_image/cached_network_image.dart';

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
      if (data.topDestination?.imageUrl != null) {
        precacheImage(CachedNetworkImageProvider(data.topDestination!.imageUrl!), context);
      }
      if (data.profile.avatar.isNotEmpty) {
        precacheImage(CachedNetworkImageProvider(data.profile.avatar), context);
      }
    }

    return Material(
      color: AppColors.background,
      child: SafeArea(
        child: RefreshIndicator(
          onRefresh: _handleRefresh,
          color: AppColors.primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // 1. Stale Indicator (Subtle)
              if (homeState.isStale)
                SliverToBoxAdapter(
                  child: Container(
                    height: 2,
                    child: const LinearProgressIndicator(
                      backgroundColor: Colors.transparent,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  ),
                ),

              // 2. Header
              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.md),
                sliver: SliverToBoxAdapter(
                  child: HomeHeader(
                    firstName: homeState.data?.profile.name.split(' ')[0] ?? 'User',
                    isLoading: homeState.isLoading && homeState.data == null,
                  ),
                ),
              ),

              // 3. Body Content
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                sliver: _buildSliverBody(homeState),
              ),
              
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
            ],
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
        child: _buildErrorState(state.error!),
      );
    }

    final data = state.data!;
    
    // Convert data for sections
    final mockGroups = data.activeGroups.map<MockGroup>((g) => MockGroup(
      id: g.id,
      name: g.name,
      destination: g.destination ?? '',
      members: g.members,
      imageUrl: g.coverImage,
    )).toList();

    final mockEvents = data.featuredTrip?.itinerary.map<MockEvent>((i) => MockEvent(
      id: i.id,
      title: i.title,
      description: i.description,
      start: DateTime.tryParse(i.datetime ?? '') ?? DateTime.now(),
      end: (DateTime.tryParse(i.datetime ?? '') ?? DateTime.now()).add(const Duration(hours: 1)),
    )).toList() ?? [];

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
        RepaintBoundary(child: GroupsSection(groups: mockGroups, isLoading: false)),
        const SizedBox(height: AppSpacing.md),
        const RepaintBoundary(child: RequestsSection(isLoading: false)),
        const SizedBox(height: AppSpacing.md),
        RepaintBoundary(child: ItinerarySection(events: mockEvents, isLoading: false)),
      ]),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: AppSpacing.md),
          Text('Something went wrong', style: AppTextStyles.h3),
          const SizedBox(height: AppSpacing.sm),
          Text(error, textAlign: TextAlign.center, style: AppTextStyles.bodyMedium),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton(
            onPressed: _handleRefresh,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}
