class KovariUser {
  final String clerkId;
  final String supabaseUuid;

  KovariUser({
    required this.clerkId,
    required this.supabaseUuid,
  });

  factory KovariUser.fromJson(Map<String, dynamic> json) {
    return KovariUser(
      clerkId: json['clerkId'] as String,
      supabaseUuid: json['supabaseUuid'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'clerkId': clerkId,
      'supabaseUuid': supabaseUuid,
    };
  }
}
