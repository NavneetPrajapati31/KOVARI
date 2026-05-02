import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../providers/explore_provider.dart';
import '../models/explore_state.dart';
import '../widgets/explore_filters_sheet.dart';
import 'package:shimmer/shimmer.dart';
import '../widgets/solo_match_card.dart';
import '../widgets/group_match_card.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        ref
            .read(exploreProvider.notifier)
            .setTravelMode(
              _tabController.index == 0 ? TravelMode.solo : TravelMode.group,
            );
      }
    });

    // Handle initial state if needed
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = ref.read(exploreProvider);
      _tabController.index = state.searchData.travelMode == TravelMode.solo
          ? 0
          : 1;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tabController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(exploreProvider.notifier).performSearch(isRefresh: true);
    }
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const ExploreFiltersSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(exploreProvider);

    // Preload Next Matches
    ref.listen(exploreProvider, (previous, next) {
      if (previous?.currentIndex != next.currentIndex) {
        for (int i = 1; i <= 3; i++) {
          final index = next.currentIndex + i;
          if (index < next.matches.length) {
            final match = next.matches[index];
            final imageUrl = next.searchData.travelMode == TravelMode.solo
                ? (match as dynamic).avatar
                : (match as dynamic).coverImage;
            if (imageUrl != null && imageUrl.isNotEmpty) {
              precacheImage(CachedNetworkImageProvider(imageUrl), context);
            }
          }
        }
      }
    });

    return Material(
      color: AppColors.background,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildHeader(state),
            Expanded(
              child: Container(
                clipBehavior: Clip.antiAlias,
                margin: const EdgeInsets.symmetric(horizontal: 16.0),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border(
                    top: BorderSide(color: AppColors.border),
                    left: BorderSide(color: AppColors.border),
                    right: BorderSide(color: AppColors.border),
                  ),
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(20),
                    bottom: Radius.circular(0),
                  ),
                ),
                child: _buildBody(state),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ExploreState state) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
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
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary, width: 1),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: AppColors.foreground,
                    labelStyle: AppTextStyles.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    unselectedLabelStyle: AppTextStyles.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    dividerColor: Colors.transparent,
                    tabs: const [
                      Tab(text: 'Solo Travel'),
                      Tab(text: 'Group Travel'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _showFilters,
                child: Container(
                  height: 40,
                  width: 85,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Center(
                    child: Text(
                      'Filters',
                      style: AppTextStyles.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
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

  Widget _buildBody(ExploreState state) {
    if (state.isLoading && state.matches.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 0),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.7,
          child: Shimmer.fromColors(
            baseColor: AppColors.card,
            highlightColor: AppColors.secondary,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
        ),
      );
    }

    if (state.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AppColors.destructive,
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
                style: AppTextStyles.h3,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                state.error!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.mutedForeground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () =>
                    ref.read(exploreProvider.notifier).performSearch(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (!state.hasSearched) {
      return _buildInitialState();
    }

    if (state.matches.isEmpty) {
      return _buildNoMatchesState();
    }

    final match = state.matches[state.currentIndex];

    return RefreshIndicator(
      onRefresh: () => ref.read(exploreProvider.notifier).performSearch(isRefresh: true),
      color: AppColors.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // 1. Pending Indicator for Optimistic UI
          if (state.isPending)
            const SliverToBoxAdapter(
              child: LinearProgressIndicator(minHeight: 2),
            ),

          // 2. Main Match Card
          SliverPadding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            sliver: SliverToBoxAdapter(
              child: RepaintBoundary(
                child: state.searchData.travelMode == TravelMode.solo
                    ? SoloMatchCard(match: match)
                    : GroupMatchCard(group: match),
              ),
            ),
          ),

          // 3. Pagination Loading
          if (state.isFetchingNextPage)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInitialState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(36.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search, size: 40, color: AppColors.muted),
            const SizedBox(height: 16),
            Text(
              'Start your search',
              style: AppTextStyles.h3,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Tap Filters to find compatible travel companions or groups for your next trip.',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            PrimaryButton(
              onPressed: _showFilters,
              text: 'Open Filters',
              height: 40,
              borderRadius: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoMatchesState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.sentiment_dissatisfied_outlined,
              size: 64,
              color: AppColors.border,
            ),
            const SizedBox(height: 24),
            Text(
              'No travelers found yet',
              style: AppTextStyles.h2,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Try adjusting your preferences or dates to find more companions.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            OutlinedButton(
              onPressed: _showFilters,
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
              ),
              child: const Text('Adjust Filters'),
            ),
          ],
        ),
      ),
    );
  }
}
