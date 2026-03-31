class KovariUser {
  final String clerkId;
  final String supabaseUuid;

  KovariUser({
    required this.clerkId,
    required this.supabaseUuid,
  });

  factory KovariUser.fromSyncResponse({
    required String clerkId,
    required Map<String, dynamic> json,
  }) {
    return KovariUser(
      clerkId: clerkId,
      supabaseUuid: json['userId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'clerkId': clerkId,
      'supabaseUuid': supabaseUuid,
    };
  }

  factory KovariUser.fromJson(Map<String, dynamic> json) {
    return KovariUser(
      clerkId: json['clerkId'] as String,
      supabaseUuid: json['supabaseUuid'] as String,
    );
  }
}