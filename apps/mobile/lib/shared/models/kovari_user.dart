class KovariUser {

  KovariUser({
    required this.id,
    required this.email,
    this.name,
    this.banned = false,
    this.banReason,
    this.banExpiresAt,
  });

  factory KovariUser.fromAuthResponse(Map<String, dynamic> json) => KovariUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      banned: json['banned'] as bool? ?? false,
      banReason: (json['banReason'] ?? json['ban_reason']) as String?,
      banExpiresAt: (json['banExpiresAt'] ?? json['ban_expires_at']) as String?,
    );

  factory KovariUser.fromJson(Map<String, dynamic> json) => KovariUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      banned: json['banned'] as bool? ?? false,
      banReason: (json['banReason'] ?? json['ban_reason']) as String?,
      banExpiresAt: (json['banExpiresAt'] ?? json['ban_expires_at']) as String?,
    );
  final String id;
  final String email;
  final String? name;
  final bool banned;
  final String? banReason;
  final String? banExpiresAt;

  Map<String, dynamic> toJson() => {
      'id': id,
      'email': email,
      'name': name,
      'banned': banned,
      'banReason': banReason,
      'banExpiresAt': banExpiresAt,
    };
}
