class UserConnection {

  UserConnection({
    required this.id,
    required this.name,
    required this.username,
    this.avatar,
    this.isFollowing = false,
  });

  factory UserConnection.fromJson(Map<String, dynamic> json) => UserConnection(
      id: (json['id'] as String?) ?? (json['_id'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      username: (json['username'] as String?) ?? '',
      avatar: (json['avatar'] as String?) ?? '',
      isFollowing: (json['isFollowing'] as bool?) ?? (json['is_following'] as bool?) ?? false,
    );
  final String id;
  final String name;
  final String username;
  final String? avatar;
  final bool isFollowing;

  UserConnection copyWith({
    String? id,
    String? name,
    String? username,
    String? avatar,
    bool? isFollowing,
  }) => UserConnection(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      avatar: avatar ?? this.avatar,
      isFollowing: isFollowing ?? this.isFollowing,
    );
}
