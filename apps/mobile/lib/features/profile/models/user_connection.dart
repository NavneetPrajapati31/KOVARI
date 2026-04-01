class UserConnection {
  final String id;
  final String name;
  final String username;
  final String? avatar;
  final bool isFollowing;

  UserConnection({
    required this.id,
    required this.name,
    required this.username,
    this.avatar,
    this.isFollowing = false,
  });

  factory UserConnection.fromJson(Map<String, dynamic> json) {
    return UserConnection(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      avatar: json['avatar'] ?? '',
      isFollowing: json['isFollowing'] ?? false,
    );
  }

  UserConnection copyWith({
    String? id,
    String? name,
    String? username,
    String? avatar,
    bool? isFollowing,
  }) {
    return UserConnection(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      avatar: avatar ?? this.avatar,
      isFollowing: isFollowing ?? this.isFollowing,
    );
  }
}
