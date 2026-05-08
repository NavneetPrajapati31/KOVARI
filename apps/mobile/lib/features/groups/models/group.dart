import 'dart:convert';
import 'package:flutter/foundation.dart';

class GroupModel {
  final String id;
  final String name;
  final String privacy;
  final String destination;
  final String? description;
  final String? notes;
  final String? aiOverview;
  final GroupDateRange dateRange;
  final int memberCount;
  final String? userStatus;
  final GroupCreator creator;
  final String creatorId;
  final String createdAt;
  final String? coverImage;
  final String? destinationImage;
  final String? status;
  final double? score;
  final List<String>? tags;
  final List<String>? languages;
  final String? smokingPolicy;
  final String? drinkingPolicy;
  final int? budget;

  const GroupModel({
    required this.id,
    required this.name,
    required this.privacy,
    required this.destination,
    this.description,
    this.notes,
    this.aiOverview,
    required this.dateRange,
    required this.memberCount,
    this.userStatus,
    required this.creator,
    required this.creatorId,
    required this.createdAt,
    this.coverImage,
    this.destinationImage,
    this.status,
    this.score,
    this.tags,
    this.languages,
    this.smokingPolicy,
    this.drinkingPolicy,
    this.budget,
  });
  GroupModel copyWith({
    String? id,
    String? name,
    String? privacy,
    String? destination,
    String? description,
    String? notes,
    String? aiOverview,
    GroupDateRange? dateRange,
    int? memberCount,
    String? userStatus,
    GroupCreator? creator,
    String? creatorId,
    String? createdAt,
    String? coverImage,
    String? destinationImage,
    String? status,
    double? score,
    List<String>? tags,
    List<String>? languages,
    String? smokingPolicy,
    String? drinkingPolicy,
    int? budget,
  }) {
    return GroupModel(
      id: id ?? this.id,
      name: name ?? this.name,
      privacy: privacy ?? this.privacy,
      destination: destination ?? this.destination,
      description: description ?? this.description,
      notes: notes ?? this.notes,
      aiOverview: aiOverview ?? this.aiOverview,
      dateRange: dateRange ?? this.dateRange,
      memberCount: memberCount ?? this.memberCount,
      userStatus: userStatus ?? this.userStatus,
      creator: creator ?? this.creator,
      creatorId: creatorId ?? this.creatorId,
      createdAt: createdAt ?? this.createdAt,
      coverImage: coverImage ?? this.coverImage,
      destinationImage: destinationImage ?? this.destinationImage,
      status: status ?? this.status,
      score: score ?? this.score,
      tags: tags ?? this.tags,
      languages: languages ?? this.languages,
      smokingPolicy: smokingPolicy ?? this.smokingPolicy,
      drinkingPolicy: drinkingPolicy ?? this.drinkingPolicy,
      budget: budget ?? this.budget,
    );
  }

  factory GroupModel.fromJson(Map<String, dynamic> json) {
    // 🛡️ Fallback ID (UUID-like placeholder if missing)
    final id =
        (json['id'] ??
                json['groupId'] ??
                'unk-${DateTime.now().millisecondsSinceEpoch}')
            .toString();

    // Handle both mobile-specific mapping (dateRange object) and generic API (start_date/end_date)
    GroupDateRange dateRange;
    if (json['dateRange'] != null) {
      dateRange = GroupDateRange.fromJson(
        json['dateRange'] as Map<String, dynamic>,
      );
    } else {
      dateRange = GroupDateRange(
        start: (json['startDate'] ?? json['start_date']) as String?,
        end: (json['endDate'] ?? json['end_date']) as String?,
        isOngoing: (json['endDate'] ?? json['end_date']) == null,
      );
    }

    // 🛡️ Debug Logic: Identifying mapping failures
    if (json['destination'] is Map) {
      final destMap = json['destination'] as Map<String, dynamic>;
      debugPrint(
        '📦 [GroupModel.fromJson] Nested Destination Map: ${destMap.keys.toList()}',
      );
    }

    final destinationImgUrl = (json['destination_image'] ??
            json['destinationImage'] ??
            (json['destination'] is Map ? json['destination']['image'] : null) ??
            (json['destination'] is Map ? json['destination']['imageUrl'] : null) ??
            (json['destination'] is Map ? json['destination']['image_url'] : null) ??
            json['destination_img'] ??
            json['destinationImg'] ??
            json['imageUrl'] ??
            json['image_url'] ??
            json['img'] ??
            json['destination_image_url'] ??
            json['destinationImageUrl'] ??
            json['location_image'] ??
            json['locationImage'] ??
            json['image'])
        as String?;

    if (destinationImgUrl == null && kDebugMode) {
      debugPrint('⚠️ [GroupModel.fromJson] Destination Image Missing for: ${json['name']}');
      debugPrint('📜 [GroupModel.fromJson] Raw JSON: $json');
    }

    return GroupModel(
      id: id,
      name: (json['name'] ?? 'Unnamed Group').toString(),
      privacy:
          (json['privacy'] as String?) ??
          (json['is_public'] == true ? 'public' : 'private'),
      destination: json['destination'] is Map
          ? (json['destination']['name'] ?? 'Unknown').toString()
          : (json['destination'] as String?) ?? 'Unknown',
      description: json['description'] as String?,
      notes: json['notes'] as String?,
      aiOverview: json['ai_overview'] as String?,
      dateRange: dateRange,
      memberCount:
          (json['memberCount'] as int?) ?? (json['members_count'] as int?) ?? 0,
      userStatus: json['userStatus'] as String?,
      creator: json['creator'] != null
          ? GroupCreator.fromJson(json['creator'] as Map<String, dynamic>)
          : GroupCreator(name: 'Unknown', username: 'unknown'),
      creatorId:
          (json['creatorId'] as String?) ??
          (json['creator_id'] as String?) ??
          '',
      createdAt:
          (json['created_at'] as String?) ??
          (json['createdAt'] as String?) ??
          '',
      coverImage:
          (json['cover_image'] ?? json['image'] ?? json['coverImage'])
              as String?,
      destinationImage: destinationImgUrl,
      status: json['status'] as String?,
      score: (json['score'] as num?)?.toDouble(),
      tags: json['tags'] != null
          ? List<String>.from(json['tags'] as List)
          : null,
      languages: json['languages'] != null
          ? List<String>.from(json['languages'] as List)
          : null,
      smokingPolicy:
          (json['smokingPolicy'] ??
                  json['smoking_policy'] ??
                  json['non_smokers']?.toString())
              as String?,
      drinkingPolicy:
          (json['drinkingPolicy'] ??
                  json['drinking_policy'] ??
                  json['non_drinkers']?.toString())
              as String?,
      budget: (json['budget'] ?? json['estimated_budget']) as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'privacy': privacy,
      'destination': destination,
      'description': description,
      'notes': notes,
      'ai_overview': aiOverview,
      'dateRange': dateRange.toJson(),
      'memberCount': memberCount,
      'userStatus': userStatus,
      'creator': creator.toJson(),
      'creatorId': creatorId,
      'created_at': createdAt,
      'cover_image': coverImage,
      'destination_image': destinationImage,
      'status': status,
      'score': score,
      'tags': tags,
      'languages': languages,
      'smokingPolicy': smokingPolicy,
      'drinkingPolicy': drinkingPolicy,
      'budget': budget,
    };
  }
}

class GroupDateRange {
  final String? start;
  final String? end;
  final bool isOngoing;

  const GroupDateRange({this.start, this.end, required this.isOngoing});

  factory GroupDateRange.fromJson(Map<String, dynamic> json) {
    return GroupDateRange(
      start: json['start'] as String?,
      end: json['end'] as String?,
      isOngoing: json['isOngoing'] as bool,
    );
  }

  Map<String, dynamic> toJson() => {
    'start': start,
    'end': end,
    'isOngoing': isOngoing,
  };
}

class GroupCreator {
  final String name;
  final String username;
  final String? avatar;

  const GroupCreator({required this.name, required this.username, this.avatar});

  factory GroupCreator.fromJson(Map<String, dynamic> json) {
    return GroupCreator(
      name: (json['name'] as String?) ?? 'Unknown',
      username: (json['username'] as String?) ?? 'unknown',
      avatar: (json['avatar'] as String?) ?? (json['profile_photo'] as String?),
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'username': username,
    'avatar': avatar,
  };
}

class GroupMember {
  final String id;
  final String name;
  final String? avatar;
  final String username;
  final String role;
  final String? clerkId;
  final String? userIdFromUserTable;

  const GroupMember({
    required this.id,
    required this.name,
    this.avatar,
    required this.username,
    required this.role,
    this.clerkId,
    this.userIdFromUserTable,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      avatar: json['avatar'] as String?,
      username: (json['username'] ?? '').toString(),
      role: (json['role'] ?? 'member') as String,
      clerkId: (json['clerkId'] ?? json['clerk_id']) as String?,
      userIdFromUserTable: json['userIdFromUserTable'] as String?,
    );
  }
}

class JoinRequestModel {
  final String id;
  final String userId;
  final String name;
  final String username;
  final String? avatar;
  final String requestedAt;

  const JoinRequestModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.username,
    this.avatar,
    required this.requestedAt,
  });

  factory JoinRequestModel.fromJson(Map<String, dynamic> json) {
    // Priority: 'userId' (backend mapped), then 'user_id' (raw DB column)
    final resolvedUserId = (json['userId'] ?? json['user_id'] ?? '').toString();

    return JoinRequestModel(
      id: (json['id'] ?? '').toString(),
      userId: resolvedUserId,
      name: (json['name'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      avatar: json['avatar'] as String?,
      requestedAt: (json['requestedAt'] ?? json['requested_at'] ?? '')
          .toString(),
    );
  }
}

class ItineraryItem {
  final String id;
  final String title;
  final String description;
  final String datetime;
  final String type;
  final String status;
  final String location;
  final String priority;
  final List<String>? assignedTo;
  final String? notes;
  final String? imageUrl;
  final String? externalLink;
  final bool? isArchived;

  const ItineraryItem({
    required this.id,
    required this.title,
    required this.description,
    required this.datetime,
    required this.type,
    required this.status,
    required this.location,
    required this.priority,
    this.assignedTo,
    this.notes,
    this.imageUrl,
    this.externalLink,
    this.isArchived,
  });

  factory ItineraryItem.fromJson(Map<String, dynamic> json) {
    // Primary database key is 'assigned_to' (uuid[] in Postgres)
    var assignedData = json['assigned_to'] ?? json['assignedTo'];

    // Handle case where assigned_to might be a JSON string (e.g. from some proxies)
    if (assignedData is String && assignedData.startsWith('[')) {
      try {
        assignedData = jsonDecode(assignedData);
      } catch (_) {}
    }

    return ItineraryItem(
      id: (json['id'] ?? '') as String,
      title: (json['title'] ?? 'Untitled') as String,
      description: (json['description'] ?? '') as String,
      datetime:
          (json['datetime'] ?? DateTime.now().toIso8601String()) as String,
      type: (json['type'] ?? 'other') as String,
      status: (json['status'] ?? 'pending') as String,
      location: (json['location'] ?? '') as String,
      priority: (json['priority'] ?? 'medium') as String,
      assignedTo: (assignedData as List<dynamic>?)
          ?.map((e) {
            if (e is Map<String, dynamic>) {
              // Robust mapping for potential nested member objects
              return (e['id'] ?? e['uid'] ?? e['userId'] ?? e['uuid'] ?? '')
                  .toString();
            }
            return e.toString();
          })
          .where((id) => id.isNotEmpty)
          .toList(),
      notes: (json['notes'] ?? json['itemNotes']) as String?,
      imageUrl: json['image_url'] as String?,
      externalLink: json['external_link'] as String?,
      isArchived: json['is_archived'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'datetime': datetime,
      'type': type,
      'status': status,
      'location': location,
      'priority': priority,
      'assigned_to': assignedTo ?? [],
      'notes': notes,
      'image_url': imageUrl,
      'external_link': externalLink,
      'is_archived': isArchived,
    };
  }
}

class MembershipInfo {
  final bool isCreator;
  final bool isMember;
  final bool isAdmin;
  final bool hasPendingRequest;
  final Map<String, dynamic>? membership;

  const MembershipInfo({
    required this.isCreator,
    required this.isMember,
    required this.isAdmin,
    required this.hasPendingRequest,
    this.membership,
  });

  factory MembershipInfo.fromJson(Map<String, dynamic> json) {
    return MembershipInfo(
      isCreator: json['isCreator'] as bool,
      isMember: json['isMember'] as bool,
      isAdmin: json['isAdmin'] as bool,
      hasPendingRequest: json['hasPendingRequest'] as bool,
      membership: json['membership'] as Map<String, dynamic>?,
    );
  }
}
