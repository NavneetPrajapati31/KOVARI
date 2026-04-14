
enum NotificationType {
  matchInterestReceived,
  matchAccepted,
  newMessage,
  groupInviteReceived,
  groupJoinRequestReceived,
  groupJoinApproved,
  reportSubmitted,
  unknown;

  static NotificationType fromString(String? type, String? entityType) {
    if (type == 'NEW_MESSAGE' || entityType == 'chat') return NotificationType.newMessage;
    if (type == 'MATCH_INTEREST_RECEIVED' || entityType == 'match') return NotificationType.matchInterestReceived;
    if (type == 'MATCH_ACCEPTED') return NotificationType.matchAccepted;
    if (type == 'GROUP_INVITE_RECEIVED') return NotificationType.groupInviteReceived;
    if (type == 'GROUP_JOIN_REQUEST_RECEIVED') return NotificationType.groupJoinRequestReceived;
    if (type == 'GROUP_JOIN_APPROVED') return NotificationType.groupJoinApproved;
    if (type == 'REPORT_SUBMITTED') return NotificationType.reportSubmitted;
    
    // Fallback based on entity type if specific type is missing
    if (entityType == 'group') return NotificationType.groupJoinApproved;
    
    return NotificationType.unknown;
  }
}

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool isRead;
  final String? imageUrl;
  final NotificationType type;
  final String? entityType;
  final String? entityId;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    this.isRead = false,
    this.imageUrl,
    required this.type,
    this.entityType,
    this.entityId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final entityType = json['entity_type'] as String?;
    final rawType = json['type'] as String?;
    
    return NotificationModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : DateTime.now(),
      isRead: json['is_read'] as bool? ?? false,
      imageUrl: json['image_url'] as String?,
      type: NotificationType.fromString(rawType, entityType),
      entityType: entityType,
      entityId: json['entity_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'message': message,
    'created_at': createdAt.toIso8601String(),
    'is_read': isRead,
    'image_url': imageUrl,
    'entity_type': entityType,
    'entity_id': entityId,
  };
}
