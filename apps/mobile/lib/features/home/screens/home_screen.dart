import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../widgets/header/home_header.dart';
import '../widgets/cards/top_destination_card.dart';
import '../widgets/cards/upcoming_trip_card.dart';
import '../widgets/cards/stat_card.dart';
import '../widgets/sections/groups_section.dart';
import '../widgets/sections/requests_section.dart';
import '../widgets/sections/itinerary_section.dart';

class HomeScreen extends StatelessWidget {
  final bool isLoading;

  const HomeScreen({super.key, this.isLoading = false});

  @override
  Widget build(BuildContext context) {
    // Mock Data
    final mockGroups = [
      MockGroup(
        id: '1',
        name: 'Europe Summer Trip',
        destination: 'Paris, France',
        members: 4,
        imageUrl:
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
      ),
      MockGroup(
        id: '2',
        name: 'Tokyo Adventure',
        destination: 'Tokyo, Japan',
        members: 3,
        imageUrl:
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1788&auto=format&fit=crop',
      ),
    ];

    final mockRequests = [
      MockRequest(
        id: '1',
        name: 'Alex Johnson',
        location: 'London, UK',
        avatarUrl: 'https://i.pravatar.cc/150?u=alex',
      ),
      MockRequest(
        id: '2',
        name: 'Sarah Miller',
        location: 'New York, USA',
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
      ),
    ];

    final mockEvents = [
      MockEvent(
        id: '1',
        title: 'Morning Flight',
        description: 'Takeoff from JFK Terminal 4',
        start: DateTime.now().add(const Duration(hours: 2)),
        end: DateTime.now().add(const Duration(hours: 4)),
        location: 'JFK Airport',
        color: EventColor.sky,
      ),
      MockEvent(
        id: '2',
        title: 'Hotel Check-in',
        description: 'Standard double room',
        start: DateTime.now().add(const Duration(hours: 6)),
        end: DateTime.now().add(const Duration(hours: 7)),
        location: 'The Grand Paris',
        color: EventColor.emerald,
      ),
      MockEvent(
        id: '3',
        title: 'Dinner at Eiffel Tower',
        start: DateTime.now().add(const Duration(days: 1, hours: 4)),
        end: DateTime.now().add(const Duration(days: 1, hours: 6)),
        location: 'Le Jules Verne',
        color: EventColor.rose,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header
              HomeHeader(
                firstName: 'Navneet',
                unreadNotificationsCount: 2,
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.xs),

              // 2. Top Destination Card
              TopDestinationCard(
                name: 'Singapore',
                imageUrl:
                    'https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg',
                onExplore: () {},
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.mds),

              // 3. Upcoming Trip Card
              UpcomingTripCard(
                name: 'Singapore',
                groupId: 'upcoming-1',
                imageUrl:
                    'https://images.pexels.com/photos/29941695/pexels-photo-29941695.jpeg',
                onExplore: () {},
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.mds),

              // 4. Stats Column
              StatCard(
                title: 'Total Travel Days',
                value: '42 days',
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.mds),
              StatCard(
                title: 'Profile Impressions',
                value: '1.2k views',
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.mds),

              // 5. Travel Groups Section
              GroupsSection(groups: mockGroups, isLoading: isLoading),
              const SizedBox(height: AppSpacing.mds),

              // 6. Requests Section
              RequestsSection(requests: mockRequests, isLoading: isLoading),
              const SizedBox(height: AppSpacing.mds),

              // 7. Itinerary Section
              ItinerarySection(events: mockEvents, isLoading: isLoading),

              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}
