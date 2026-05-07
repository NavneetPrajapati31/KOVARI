class KovariUser {
  final String id;
  final String email;
  final String? name;
  final bool banned;
  final String? banReason;
  final String? banExpiresAt;

  KovariUser({
    required this.id,
    required this.email,
    this.name,
    this.banned = false,
    this.banReason,
    this.banExpiresAt,
  });

  factory KovariUser.fromAuthResponse(Map<String, dynamic> json) {
    return KovariUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      banned: json['banned'] as bool? ?? false,
      banReason: (json['banReason'] ?? json['ban_reason']) as String?,
      banExpiresAt: (json['banExpiresAt'] ?? json['ban_expires_at']) as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'banned': banned,
      'banReason': banReason,
      'banExpiresAt': banExpiresAt,
    };
  }

  factory KovariUser.fromJson(Map<String, dynamic> json) {
    return KovariUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      banned: json['banned'] as bool? ?? false,
      banReason: (json['banReason'] ?? json['ban_reason']) as String?,
      banExpiresAt: (json['banExpiresAt'] ?? json['ban_expires_at']) as String?,
    );
  }
}
