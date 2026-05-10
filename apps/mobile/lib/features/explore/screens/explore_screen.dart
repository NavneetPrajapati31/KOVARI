import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/explore/models/match_user.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../providers/explore_provider.dart';
import '../models/explore_state.dart';
import '../widgets/explore_filters_sheet.dart';
import '../widgets/solo_match_card.dart';
import '../widgets/group_match_card.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/widgets/kovari_empty_state.dart';
import '../../../shared/widgets/interactive_wrapper.dart';
import '../../../shared/utils/scroll_preloader.dart';
import '../../../core/widgets/skeletons/kovari_skeletons.dart';
import '../../../core/services/haptic_service.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen>
    with
        SingleTickerProviderStateMixin,
        WidgetsBindingObserver,
        AutomaticKeepAliveClientMixin {
  late TabController _tabController;

  @override
  bool get wantKeepAlive => true;

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
      ref.read(exploreProvider.notifier).performSearch(isSilent: true);
    }
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const ExploreFiltersSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final state = ref.watch(exploreProvider);

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

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          _buildHeader(state),
          Expanded(
            child: ScrollPreloader(
              onIdle: () {
                if (state.matches.isNotEmpty) {
                  ref
                      .read(exploreProvider.notifier)
                      .performSearch(isSilent: true);
                }
              },
              child: AppCard(
                width: double.infinity,
                padding: EdgeInsets.zero,
                margin: const EdgeInsets.symmetric(horizontal: 16.0),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
                border: Border(
                  top: BorderSide(color: AppColors.borderColor(context)),
                  left: BorderSide(color: AppColors.borderColor(context)),
                  right: BorderSide(color: AppColors.borderColor(context)),
                  bottom: BorderSide.none,
                ),
                boxShadow: const [],
                child: _buildBody(state),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(ExploreState state) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: AppCard(
              height: 44,
              padding: EdgeInsets.zero,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [],
              child: TabBar(
                controller: _tabController,
                onTap: (index) => HapticService.selection(),
                overlayColor: WidgetStateProperty.all(Colors.transparent),
                splashFactory: NoSplash.splashFactory,
                indicator: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.primary, width: 1),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.text(context, isMuted: true),
                labelStyle: AppTextStyles.bodySmall.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                unselectedLabelStyle: AppTextStyles.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Solo'),
                  Tab(text: 'Groups'),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          InteractiveWrapper(
            onPressed: _showFilters,
            child: AppCard(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [],
              child: Center(
                child: Text(
                  'Filters',
                  style: AppTextStyles.bodySmall.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.text(context, isMuted: true),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(ExploreState state) {
    if (state.isLoading && state.matches.isEmpty) {
      return const KovariSkeletonExplore();
    }

    if (state.error != null) {
      return KovariEmptyState(
        title: 'Something went wrong',
        description: state.error!,
        icon: Icons.error_outline,
        actionLabel: 'Retry',
        onAction: () => ref.read(exploreProvider.notifier).performSearch(),
      );
    }

    if (!state.hasSearched) {
      return KovariEmptyState(
        title: 'Start your search',
        description:
            'Tap Filters to find compatible travel companions or groups for your next trip.',
        icon: Icons.search,
        actionLabel: 'Open Filters',
        onAction: _showFilters,
      );
    }

    if (state.matches.isEmpty) {
      return KovariEmptyState(
        title: 'No travelers found yet',
        description:
            'Try adjusting your preferences or dates to find more companions.',
        icon: Icons.sentiment_dissatisfied_outlined,
        actionLabel: 'Adjust Filters',
        onAction: _showFilters,
      );
    }

    final match = state.matches[state.currentIndex];

    // Defensive check for type mismatch during transitions
    final isTypeMismatch = (state.searchData.travelMode == TravelMode.solo &&
            match is! MatchUser) ||
        (state.searchData.travelMode == TravelMode.group &&
            match is! GroupModel);

    if (isTypeMismatch) {
      return const KovariSkeletonExplore();
    }

    return CustomScrollView(
      key: const PageStorageKey('explore_scroll'),
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          sliver: SliverToBoxAdapter(
            child: RepaintBoundary(
              child: state.searchData.travelMode == TravelMode.solo
                  ? SoloMatchCard(match: match as MatchUser)
                  : GroupMatchCard(group: match as GroupModel),
            ),
          ),
        ),
        if (state.isFetchingNextPage)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            ),
          ),
        const SliverToBoxAdapter(
          child: SizedBox(height: 110),
        ),
      ],
    );
  }
}
