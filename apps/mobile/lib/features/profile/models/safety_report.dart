class SafetyReport {
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

  factory SafetyReport.fromJson(Map<String, dynamic> json) {
    return SafetyReport(
      id: json['id']?.toString() ?? '',
      targetType: json['targetType'] ?? 'user',
      targetId: json['targetId']?.toString() ?? '',
      targetName: json['targetName'] ?? 'Unknown',
      targetUsername: json['targetUsername'],
      targetImageUrl: json['targetImageUrl'] ?? '',
      targetMemberCount: json['targetMemberCount'],
      reason: json['reason'] ?? '',
      additionalNotes: json['additionalNotes'] ?? '',
      evidenceUrl: json['evidenceUrl'] ?? '',
      status: json['status'] ?? 'pending',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class SafetyTarget {
  final String id;
  final String name;
  final String? username;
  final String? imageUrl;

  SafetyTarget({
    required this.id,
    required this.name,
    this.username,
    this.imageUrl,
  });

  factory SafetyTarget.fromJson(Map<String, dynamic> json) {
    return SafetyTarget(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      username: json['username'],
      imageUrl: json['imageUrl'],
    );
  }
}
