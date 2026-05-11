class SafetyReport {

  SafetyReport({
    required this.id,
    required this.targetType,
    required this.targetId,
    required this.targetName,
    this.targetUsername,
    required this.targetImageUrl,
    this.targetMemberCount,
    required this.reason,
    required this.additionalNotes,
    required this.evidenceUrl,
    required this.status,
    required this.createdAt,
  });

  factory SafetyReport.fromJson(Map<String, dynamic> json) => SafetyReport(
      id: json['id']?.toString() ?? '',
      targetType: (json['targetType'] as String?) ?? (json['target_type'] as String?) ?? 'user',
      targetId: json['targetId']?.toString() ?? json['target_id']?.toString() ?? '',
      targetName: (json['targetName'] as String?) ?? (json['target_name'] as String?) ?? 'Unknown',
      targetUsername: (json['targetUsername'] as String?) ?? (json['target_username'] as String?),
      targetImageUrl: (json['targetImageUrl'] as String?) ?? (json['target_image_url'] as String?) ?? '',
      targetMemberCount: json['targetMemberCount'] as int? ?? json['target_member_count'] as int?,
      reason: (json['reason'] as String?) ?? '',
      additionalNotes: (json['additionalNotes'] as String?) ?? (json['additional_notes'] as String?) ?? '',
      evidenceUrl: (json['evidenceUrl'] as String?) ?? (json['evidence_url'] as String?) ?? '',
      status: (json['status'] as String?) ?? 'pending',
      createdAt: DateTime.tryParse((json['createdAt'] as String?) ?? (json['created_at'] as String?) ?? '') ?? DateTime.now(),
    );
  final String id;
  final String targetType; // 'user' or 'group'
  final String targetId;
  final String targetName;
  final String? targetUsername;
  final String targetImageUrl;
  final int? targetMemberCount;
  final String reason;
  final String additionalNotes;
  final String evidenceUrl;
  final String status;
  final DateTime createdAt;
}

class SafetyTarget {

  SafetyTarget({
    required this.id,
    required this.name,
    this.username,
    this.imageUrl,
  });

  factory SafetyTarget.fromJson(Map<String, dynamic> json) => SafetyTarget(
      id: json['id']?.toString() ?? '',
      name: (json['name'] as String?) ?? '',
      username: (json['username'] as String?),
      imageUrl: (json['imageUrl'] as String?) ?? (json['image_url'] as String?),
    );
  final String id;
  final String name;
  final String? username;
  final String? imageUrl;
}
