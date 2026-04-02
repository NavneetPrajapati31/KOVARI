import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../widgets/header/home_header.dart';
import '../widgets/cards/top_destination_card.dart';
import '../widgets/cards/upcoming_trip_card.dart';
import '../widgets/cards/stat_card.dart';
import '../widgets/sections/groups_section.dart';
import '../widgets/sections/requests_section.dart';
import '../widgets/sections/itinerary_section.dart';
import '../data/home_service.dart';
import '../models/home_data.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late Future<HomeData> _fetchFuture;

  @override
  void initState() {
    super.initState();
    _fetchHomeData();
  }

  void _fetchHomeData() {
    print("DEBUG: HomeScreen _fetchHomeData triggered");
    try {
      final apiClient = ApiClientFactory.create();
      final homeService = HomeService(apiClient);
      _fetchFuture = homeService.getHomeData();
    } catch (e) {
      print("DEBUG: HomeScreen _fetchHomeData error: $e");
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _fetchHomeData();
    });
    await _fetchFuture;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _handleRefresh,
          color: AppColors.primary,
          child: FutureBuilder<HomeData>(
            future: _fetchFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return _buildHomeUI(isLoading: true);
              } else if (snapshot.hasError) {
                return _buildErrorState(snapshot.error.toString());
              } else if (!snapshot.hasData) {
                return _buildErrorState("No data available");
              }

              return _buildHomeUI(data: snapshot.data!);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHomeUI({HomeData? data, bool isLoading = false}) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header
          HomeHeader(
            firstName: data?.profile.name.split(' ')[0] ?? 'User',
            unreadNotificationsCount: data?.unreadNotificationCount ?? 0,
            isLoading: false,
          ),
          const SizedBox(height: AppSpacing.xs),

          // 2. Top Destination Card
          if (isLoading || data != null) ...[
            TopDestinationCard(
              name: data?.topDestination?.name ?? '',
              imageUrl: data?.topDestination?.imageUrl,
              onExplore: () {},
              isLoading: isLoading,
            ),
            const SizedBox(height: AppSpacing.mds),
          ],

          // 3. Featured/Upcoming Trip Card (Shows Empty state if null)
          if (isLoading || data != null) ...[
            UpcomingTripCard(
              name: data?.featuredTrip?.name ?? '',
              groupId: data?.featuredTrip?.id,
              imageUrl: data?.featuredTrip?.coverImage,
              onExplore: () {},
              isLoading: isLoading,
            ),
            const SizedBox(height: AppSpacing.mds),
          ],

          // 4. Stats Column
          StatCard(
            title: 'Total Travel Days',
            value: data?.stats.travelDaysDisplay ?? '0 days',
            isLoading: isLoading,
          ),
          const SizedBox(height: AppSpacing.mds),
          StatCard(
            title: 'Profile Impressions',
            value: data?.stats.impressionsDisplay ?? '0 impressions',
            isLoading: isLoading,
          ),
          const SizedBox(height: AppSpacing.mds),

          // 5. Travel Groups Section
          if (isLoading || data != null) ...[
            _buildGroupsSection(data, isLoading),
            const SizedBox(height: AppSpacing.mds),
          ],

          // 6. Requests Section (Interests)
          if (isLoading || data != null) ...[
            _buildRequestsSection(data, isLoading),
            const SizedBox(height: AppSpacing.mds),
          ],

          // 7. Itinerary Section (Featured Trip Items)
          if (isLoading || data != null) ...[
            _buildItinerarySection(data, isLoading),
          ],

          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    );
  }

  Widget _buildGroupsSection(HomeData? data, bool isLoading) {
    // Current UI expects MockGroup, we should map TravelGroup -> MockGroup or update widget
    // For now we map to satisfy existing interface
    final groups = (data?.activeGroups ?? [])
        .map(
          (g) => MockGroup(
            id: g.id,
            name: g.name,
            destination: g.destination ?? 'Unknown',
            members: g.members,
            imageUrl: g.coverImage ?? '',
          ),
        )
        .toList();

    return GroupsSection(groups: groups, isLoading: isLoading);
  }

  Widget _buildRequestsSection(HomeData? data, bool isLoading) {
    final requests = (data?.connectionRequests ?? [])
        .map(
          (r) => MockRequest(
            id: r.id,
            name: r.sender.name,
            location: r.sender.location,
            avatarUrl: r.sender.avatar,
          ),
        )
        .toList();

    return RequestsSection(requests: requests, isLoading: isLoading);
  }

  Widget _buildItinerarySection(HomeData? data, bool isLoading) {
    final events = (data?.featuredTrip?.itinerary ?? [])
        .map(
          (i) => MockEvent(
            id: i.id,
            title: i.title,
            description: i.description ?? '',
            start: i.datetime != null
                ? DateTime.parse(i.datetime!).toLocal()
                : DateTime.now(),
            end: i.datetime != null
                ? DateTime.parse(
                    i.datetime!,
                  ).toLocal().add(const Duration(hours: 1))
                : DateTime.now().add(const Duration(hours: 1)),
            location: data?.featuredTrip?.destination ?? 'Trip Destination',
            color: EventColor.sky,
          ),
        )
        .toList();

    return ItinerarySection(events: events, isLoading: isLoading);
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: AppSpacing.md),
            Text('Something went wrong', style: AppTextStyles.h3),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Failed to load home data. Please check your connection.',
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _fetchHomeData();
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
