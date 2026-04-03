class Group {
  final String id;
  final String name;
  final String privacy;
  final String destination;
  final GroupDateRange dateRange;
  final int memberCount;
  final String? userStatus;
  final GroupCreator creator;
  final String creatorId;
  final String createdAt;
  final String? coverImage;
  final String? status;

  Group({
    required this.id,
    required this.name,
    required this.privacy,
    required this.destination,
    required this.dateRange,
    required this.memberCount,
    this.userStatus,
    required this.creator,
    required this.creatorId,
    required this.createdAt,
    this.coverImage,
    this.status,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as String,
      name: json['name'] as String,
      privacy: json['privacy'] as String,
      destination: json['destination'] as String,
      dateRange: GroupDateRange.fromJson(json['dateRange'] as Map<String, dynamic>),
      memberCount: json['memberCount'] as int,
      userStatus: json['userStatus'] as String?,
      creator: GroupCreator.fromJson(json['creator'] as Map<String, dynamic>),
      creatorId: json['creatorId'] as String,
      createdAt: json['created_at'] as String,
      coverImage: json['cover_image'] as String?,
      status: json['status'] as String?,
    );
  }
}

class GroupDateRange {
  final String? start;
  final String? end;
  final bool isOngoing;

  GroupDateRange({
    this.start,
    this.end,
    required this.isOngoing,
  });

  factory GroupDateRange.fromJson(Map<String, dynamic> json) {
    return GroupDateRange(
      start: json['start'] as String?,
      end: json['end'] as String?,
      isOngoing: json['isOngoing'] as bool,
    );
  }
}

class GroupCreator {
  final String name;
  final String username;
  final String? avatar;

  GroupCreator({
    required this.name,
    required this.username,
    this.avatar,
  });

  factory GroupCreator.fromJson(Map<String, dynamic> json) {
    return GroupCreator(
      name: json['name'] as String,
      username: json['username'] as String,
      avatar: json['avatar'] as String?,
    );
  }
}
