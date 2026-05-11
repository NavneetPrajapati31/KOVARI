import 'package:intl/intl.dart';

class HomeData {

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

  factory HomeData.fromJson(Map<String, dynamic> json) => HomeData(
      profile: UserProfile.fromJson((json['profile'] as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{}),
      stats: TripStats.fromJson((json['stats'] as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{}),
      topDestination: json['topDestination'] != null
          ? TopDestination.fromJson(json['topDestination'] as Map<String, dynamic>)
          : null,
      featuredTrip: json['featuredTrip'] != null
          ? FeaturedTrip.fromJson(json['featuredTrip'] as Map<String, dynamic>)
          : null,
      recentNotifications: (json['recentNotifications'] as List? ?? [])
          .map((e) => HomeNotification.fromJson(e as Map<String, dynamic>))
          .toList(),
      unreadNotificationCount: (json['unreadNotificationCount'] as int?) ?? 0,
      activeGroups: (json['activeGroups'] as List? ?? [])
          .map((e) => TravelGroup.fromJson(e as Map<String, dynamic>))
          .toList(),
      pendingInvitesCount: (json['pendingInvitesCount'] as int?) ?? 0,
      connectionRequests: (json['connectionRequests'] as List? ?? [])
          .map((e) => ConnectionRequest.fromJson(e as Map<String, dynamic>))
          .toList(),
      travelPreferences: json['travelPreferences'] != null
          ? TravelPreferences.fromJson(json['travelPreferences'] as Map<String, dynamic>)
          : null,
    );
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
}

class UserProfile {

  UserProfile({
    required this.name,
    required this.username,
    required this.avatar,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
      name: (json['name'] as String?) ?? '',
      username: (json['username'] as String?) ?? '',
      avatar: (json['avatar'] as String?) ?? '',
    );
  final String name;
  final String username;
  final String avatar;
}

class TripStats {

  TripStats({
    required this.totalTrips,
    required this.upcomingTripsCount,
    required this.pastTripsCount,
    required this.totalTravelDays,
    required this.profileImpressions,
  });

  factory TripStats.fromJson(Map<String, dynamic> json) => TripStats(
      totalTrips: (json['totalTrips'] as int?) ?? 0,
      upcomingTripsCount: (json['upcomingTripsCount'] as int?) ?? 0,
      pastTripsCount: (json['pastTripsCount'] as int?) ?? 0,
      totalTravelDays: (json['totalTravelDays'] as int?) ?? 0,
      profileImpressions: (json['profileImpressions'] as int?) ?? 0,
    );
  final int totalTrips;
  final int upcomingTripsCount;
  final int pastTripsCount;
  final int totalTravelDays;
  final int profileImpressions;

  String get travelDaysDisplay => '$totalTravelDays days';
  String get impressionsDisplay => profileImpressions >= 1000
      ? '${(profileImpressions / 1000).toStringAsFixed(1)}k impressions'
      : '$profileImpressions impressions';
}

class TopDestination {

  TopDestination({required this.name, required this.country, this.imageUrl});

  factory TopDestination.fromJson(Map<String, dynamic> json) => TopDestination(
      name: (json['name'] as String?) ?? '',
      country: (json['country'] as String?) ?? '',
      imageUrl: (json['imageUrl'] as String?),
    );
  final String name;
  final String country;
  final String? imageUrl;

  String get fullLocation => country.isNotEmpty ? '$name, $country' : name;
}

class FeaturedTrip {

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

  factory FeaturedTrip.fromJson(Map<String, dynamic> json) => FeaturedTrip(
      id: (json['id'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      role: (json['role'] as String?) ?? '',
      members: (json['members'] as int?) ?? 0,
      destination: (json['destination'] as String?),
      startDate: (json['startDate'] as String?),
      endDate: (json['endDate'] as String?),
      coverImage: (json['coverImage'] as String?),
      itinerary: (json['itinerary'] as List? ?? [])
          .map((e) => ItineraryItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  final String id;
  final String name;
  final String role;
  final int members;
  final String? destination;
  final String? startDate;
  final String? endDate;
  final String? coverImage;
  final List<ItineraryItem> itinerary;

  String get displayDestination => destination ?? 'No trips yet';

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

  ItineraryItem({
    required this.id,
    required this.title,
    this.description,
    this.datetime,
  });

  factory ItineraryItem.fromJson(Map<String, dynamic> json) => ItineraryItem(
      id: (json['id'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      description: (json['description'] as String?),
      datetime: (json['datetime'] as String?),
    );
  final String id;
  final String title;
  final String? description;
  final String? datetime;

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

  HomeNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.imageUrl,
  });

  factory HomeNotification.fromJson(Map<String, dynamic> json) => HomeNotification(
      id: (json['id'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      message: (json['message'] as String?) ?? '',
      type: (json['type'] as String?) ?? '',
      isRead: (json['is_read'] as bool?) ?? false,
      createdAt: (json['created_at'] as String?) ?? '',
      imageUrl: (json['image_url'] as String?),
    );
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String createdAt;
  final String? imageUrl;
}

class TravelGroup {

  TravelGroup({
    required this.id,
    required this.name,
    required this.role,
    required this.members,
    this.destination,
    this.startDate,
    this.coverImage,
  });

  factory TravelGroup.fromJson(Map<String, dynamic> json) => TravelGroup(
      id: (json['id'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      role: (json['role'] as String?) ?? '',
      members: (json['members'] as int?) ?? 0,
      destination: (json['destination'] as String?),
      startDate: (json['startDate'] as String?),
      coverImage: (json['coverImage'] as String?),
    );
  final String id;
  final String name;
  final String role;
  final int members;
  final String? destination;
  final String? startDate;
  final String? coverImage;
}

class ConnectionRequest {

  ConnectionRequest({
    required this.id,
    required this.sender,
    this.destination,
    required this.sentAt,
  });

  factory ConnectionRequest.fromJson(Map<String, dynamic> json) => ConnectionRequest(
      id: (json['id'] as String?) ?? '',
      sender: Sender.fromJson((json['sender'] as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{}),
      destination: (json['destination'] as String?),
      sentAt: (json['sentAt'] as String?) ?? '',
    );
  final String id;
  final Sender sender;
  final String? destination;
  final String sentAt;
}

class Sender {

  Sender({
    required this.id,
    required this.name,
    required this.avatar,
    required this.location,
  });

  factory Sender.fromJson(Map<String, dynamic> json) => Sender(
      id: (json['id'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      avatar: (json['avatar'] as String?) ?? '',
      location: (json['location'] as String?) ?? '',
    );
  final String id;
  final String name;
  final String avatar;
  final String location;
}

class TravelPreferences {

  TravelPreferences({
    required this.destinations,
    required this.tripFocus,
    this.frequency,
  });

  factory TravelPreferences.fromJson(Map<String, dynamic> json) => TravelPreferences(
      destinations: List<String>.from(json['destinations'] as Iterable? ?? <dynamic>[]),
      tripFocus: List<String>.from(json['trip_focus'] as Iterable? ?? <dynamic>[]),
      frequency: (json['frequency'] as String?),
    );
  final List<String> destinations;
  final List<String> tripFocus;
  final String? frequency;
}
