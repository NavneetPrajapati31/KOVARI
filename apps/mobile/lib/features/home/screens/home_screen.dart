import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
import '../../notifications/providers/notification_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app_shell/providers/app_shell_provider.dart';

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
    // Refresh the home data provider
    await ref.read(homeDataProvider.notifier).refresh();
    // Also refresh the reactive unread count notifier
    ref.read(unreadCountProvider.notifier).refresh();
  }

  Future<void> _handleExploreTopDestination(String name) async {
    if (name.isEmpty) return;
    final Uri url = Uri.parse(
      'https://maps.apple.com/search?q=${Uri.encodeComponent(name)}',
    );
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        // Fallback to Google Maps if Apple Maps isn't available/supported
        final Uri googleMapsUrl = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(name)}',
        );
        if (await canLaunchUrl(googleMapsUrl)) {
          await launchUrl(googleMapsUrl);
        }
      }
    } catch (e) {
      debugPrint('Error launching maps: $e');
    }
  }

  void _handleExploreUpcomingTrip(String? groupId) {
    // Navigate to the Groups tab (index 3)
    ref.read(appShellIndexProvider.notifier).setIndex(3);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required by AutomaticKeepAliveClientMixin

    final homeDataAsync = ref.watch(homeDataProvider);

    // Synchronized Pre-caching Side Effect (Instant-Load Fix)
    ref.listen(homeDataProvider, (previous, next) {
      if (next.hasValue) {
        final data = next.value!;
        // Pre-cache all dashboard images using the same provider as the widgets
        if (data.topDestination?.imageUrl != null &&
            data.topDestination!.imageUrl!.isNotEmpty) {
          precacheImage(
            CachedNetworkImageProvider(data.topDestination!.imageUrl!),
            context,
          );
        }
        if (data.featuredTrip?.coverImage != null &&
            data.featuredTrip!.coverImage!.isNotEmpty) {
          precacheImage(
            CachedNetworkImageProvider(data.featuredTrip!.coverImage!),
            context,
          );
        }
        if (data.profile.avatar.isNotEmpty) {
          precacheImage(
            CachedNetworkImageProvider(data.profile.avatar),
            context,
          );
        }
      }
    });

    return Material(
      color: AppColors.background,
      child: SafeArea(
        child: RefreshIndicator(
          onRefresh: _handleRefresh,
          color: AppColors.primary,
          child: homeDataAsync.when(
            data: (data) => _buildHomeUI(context, data: data),
            loading: () => homeDataAsync.hasValue
                ? _buildHomeUI(context, data: homeDataAsync.value)
                : _buildHomeUI(context, isLoading: true),
            error: (error, _) => homeDataAsync.hasValue
                ? _buildHomeUI(context, data: homeDataAsync.value)
                : _buildErrorState(error.toString()),
          ),
        ),
      ),
    );
  }

  Widget _buildHomeUI(
    BuildContext context, {
    HomeData? data,
    bool isLoading = false,
  }) {
    // Correctly map data for sections
    final mockGroups =
        data?.activeGroups
            .map<MockGroup>(
              (g) => MockGroup(
                id: g.id,
                name: g.name,
                destination: g.destination ?? '',
                members: g.members,
                imageUrl: g.coverImage,
              ),
            )
            .toList() ??
        [];

    final mockEvents =
        data?.featuredTrip?.itinerary
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

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header
          HomeHeader(
            firstName: data?.profile.name.split(' ')[0] ?? 'User',
            isLoading: false,
          ),
          const SizedBox(height: AppSpacing.xs),

          // 2. Top Destination Card
          if (isLoading || data != null) ...[
            TopDestinationCard(
              key: data?.topDestination != null
                  ? ValueKey('top-${data!.topDestination!.name}')
                  : null,
              name: data?.topDestination?.name ?? '',
              imageUrl: data?.topDestination?.imageUrl,
              onExplore: () => _handleExploreTopDestination(
                data?.topDestination?.name ?? '',
              ),
              isLoading: isLoading,
            ),
            const SizedBox(height: AppSpacing.mds),
          ],

          // 3. Featured/Upcoming Trip Card (Shows Empty state if null)
          if (isLoading || data != null) ...[
            UpcomingTripCard(
              key: data?.featuredTrip != null
                  ? ValueKey('upcoming-${data!.featuredTrip!.id}')
                  : null,
              name: data?.featuredTrip?.name ?? '',
              groupId: data?.featuredTrip?.id,
              imageUrl: data?.featuredTrip?.coverImage,
              onExplore: () =>
                  _handleExploreUpcomingTrip(data?.featuredTrip?.id),
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
            GroupsSection(groups: mockGroups, isLoading: isLoading),
            const SizedBox(height: AppSpacing.md),
          ],

          // 6. Network/Requests Section
          if (isLoading || data != null) ...[
            RequestsSection(isLoading: isLoading),
            const SizedBox(height: AppSpacing.md),
          ],

          // 7. Itinerary Section
          if (isLoading || data != null) ...[
            ItinerarySection(events: mockEvents, isLoading: isLoading),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: AppSpacing.md),
            Text('Oops! Something went wrong', style: AppTextStyles.h3),
            const SizedBox(height: AppSpacing.sm),
            Text(
              error,
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton(
              onPressed: _handleRefresh,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
