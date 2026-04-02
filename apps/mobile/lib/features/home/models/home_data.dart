import 'package:intl/intl.dart';

class HomeData {
  final UserProfile profile;
  final TripStats stats;
  final TopDestination? topDestination;
  final FeaturedTrip? featuredTrip;
  final List<HomeNotification> recentNotifications;
  final int unreadNotificationCount;
  final List<TravelGroup> activeGroups;
  final int pendingInvitesCount;
  final List<ConnectionRequest> connectionRequests;
  final TravelPreferences? travelPreferences;

  // TODO: migrate to Riverpod for reactive updates

  HomeData({
    required this.profile,
    required this.stats,
    this.topDestination,
    this.featuredTrip,
    required this.recentNotifications,
    required this.unreadNotificationCount,
    required this.activeGroups,
    required this.pendingInvitesCount,
    required this.connectionRequests,
    this.travelPreferences,
  });

  factory HomeData.fromJson(Map<String, dynamic> json) {
    return HomeData(
      profile: UserProfile.fromJson(json['profile'] ?? {}),
      stats: TripStats.fromJson(json['stats'] ?? {}),
      topDestination: json['topDestination'] != null
          ? TopDestination.fromJson(json['topDestination'])
          : null,
      featuredTrip: json['featuredTrip'] != null
          ? FeaturedTrip.fromJson(json['featuredTrip'])
          : null,
      recentNotifications: (json['recentNotifications'] as List? ?? [])
          .map((e) => HomeNotification.fromJson(e))
          .toList(),
      unreadNotificationCount: json['unreadNotificationCount'] ?? 0,
      activeGroups: (json['activeGroups'] as List? ?? [])
          .map((e) => TravelGroup.fromJson(e))
          .toList(),
      pendingInvitesCount: json['pendingInvitesCount'] ?? 0,
      connectionRequests: (json['connectionRequests'] as List? ?? [])
          .map((e) => ConnectionRequest.fromJson(e))
          .toList(),
      travelPreferences: json['travelPreferences'] != null
          ? TravelPreferences.fromJson(json['travelPreferences'])
          : null,
    );
  }
}

class UserProfile {
  final String name;
  final String username;
  final String avatar;

  UserProfile({
    required this.name,
    required this.username,
    required this.avatar,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      avatar: json['avatar'] ?? '',
    );
  }
}

class TripStats {
  final int totalTrips;
  final int upcomingTripsCount;
  final int pastTripsCount;
  final int totalTravelDays;
  final int profileImpressions;

  TripStats({
    required this.totalTrips,
    required this.upcomingTripsCount,
    required this.pastTripsCount,
    required this.totalTravelDays,
    required this.profileImpressions,
  });

  factory TripStats.fromJson(Map<String, dynamic> json) {
    return TripStats(
      totalTrips: json['totalTrips'] ?? 0,
      upcomingTripsCount: json['upcomingTripsCount'] ?? 0,
      pastTripsCount: json['pastTripsCount'] ?? 0,
      totalTravelDays: json['totalTravelDays'] ?? 0,
      profileImpressions: json['profileImpressions'] ?? 0,
    );
  }

  String get travelDaysDisplay => '$totalTravelDays days';
  String get impressionsDisplay => profileImpressions >= 1000
      ? '${(profileImpressions / 1000).toStringAsFixed(1)}k impressions'
      : '$profileImpressions impressions';
}

class TopDestination {
  final String name;
  final String country;
  final String? imageUrl;

  TopDestination({required this.name, required this.country, this.imageUrl});

  factory TopDestination.fromJson(Map<String, dynamic> json) {
    return TopDestination(
      name: json['name'] ?? '',
      country: json['country'] ?? '',
      imageUrl: json['imageUrl'],
    );
  }

  String get fullLocation => country.isNotEmpty ? '$name, $country' : name;
}

class FeaturedTrip {
  final String id;
  final String name;
  final String role;
  final int members;
  final String? destination;
  final String? startDate;
  final String? endDate;
  final String? coverImage;
  final List<ItineraryItem> itinerary;

  FeaturedTrip({
    required this.id,
    required this.name,
    required this.role,
    required this.members,
    this.destination,
    this.startDate,
    this.endDate,
    this.coverImage,
    required this.itinerary,
  });

  factory FeaturedTrip.fromJson(Map<String, dynamic> json) {
    return FeaturedTrip(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      members: json['members'] ?? 0,
      destination: json['destination'],
      startDate: json['startDate'],
      endDate: json['endDate'],
      coverImage: json['coverImage'],
      itinerary: (json['itinerary'] as List? ?? [])
          .map((e) => ItineraryItem.fromJson(e))
          .toList(),
    );
  }

  String get displayDestination => destination ?? "No trips yet";

  String get formattedStartDate {
    if (startDate == null) return '';
    try {
      return DateFormat('dd MMM').format(DateTime.parse(startDate!).toLocal());
    } catch (e) {
      return '';
    }
  }
}

class ItineraryItem {
  final String id;
  final String title;
  final String? description;
  final String? datetime;

  ItineraryItem({
    required this.id,
    required this.title,
    this.description,
    this.datetime,
  });

  factory ItineraryItem.fromJson(Map<String, dynamic> json) {
    return ItineraryItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      datetime: json['datetime'],
    );
  }

  String get formattedTime {
    if (datetime == null) return '';
    try {
      return DateFormat('HH:mm').format(DateTime.parse(datetime!).toLocal());
    } catch (e) {
      return '';
    }
  }
}

class HomeNotification {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String createdAt;
  final String? imageUrl;

  HomeNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.imageUrl,
  });

  factory HomeNotification.fromJson(Map<String, dynamic> json) {
    return HomeNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? '',
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'] ?? '',
      imageUrl: json['image_url'],
    );
  }
}

class TravelGroup {
  final String id;
  final String name;
  final String role;
  final int members;
  final String? destination;
  final String? startDate;
  final String? coverImage;

  TravelGroup({
    required this.id,
    required this.name,
    required this.role,
    required this.members,
    this.destination,
    this.startDate,
    this.coverImage,
  });

  factory TravelGroup.fromJson(Map<String, dynamic> json) {
    return TravelGroup(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      members: json['members'] ?? 0,
      destination: json['destination'],
      startDate: json['startDate'],
      coverImage: json['coverImage'],
    );
  }
}

class ConnectionRequest {
  final String id;
  final Sender sender;
  final String? destination;
  final String sentAt;

  ConnectionRequest({
    required this.id,
    required this.sender,
    this.destination,
    required this.sentAt,
  });

  factory ConnectionRequest.fromJson(Map<String, dynamic> json) {
    return ConnectionRequest(
      id: json['id'] ?? '',
      sender: Sender.fromJson(json['sender'] ?? {}),
      destination: json['destination'],
      sentAt: json['sentAt'] ?? '',
    );
  }
}

class Sender {
  final String id;
  final String name;
  final String avatar;
  final String location;

  Sender({
    required this.id,
    required this.name,
    required this.avatar,
    required this.location,
  });

  factory Sender.fromJson(Map<String, dynamic> json) {
    return Sender(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      avatar: json['avatar'] ?? '',
      location: json['location'] ?? '',
    );
  }
}

class TravelPreferences {
  final List<String> destinations;
  final List<String> tripFocus;
  final String? frequency;

  TravelPreferences({
    required this.destinations,
    required this.tripFocus,
    this.frequency,
  });

  factory TravelPreferences.fromJson(Map<String, dynamic> json) {
    return TravelPreferences(
      destinations: List<String>.from(json['destinations'] ?? []),
      tripFocus: List<String>.from(json['trip_focus'] ?? []),
      frequency: json['frequency'],
    );
  }
}
