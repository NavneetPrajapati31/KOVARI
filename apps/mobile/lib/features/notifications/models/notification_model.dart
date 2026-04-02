
enum NotificationType {
  matchInterestReceived,
  matchAccepted,
  newMessage,
  groupInviteReceived,
  groupJoinRequestReceived,
  groupJoinApproved,
  reportSubmitted,
}

class MockNotification {
  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool isRead;
  final String? imageUrl;
  final NotificationType type;

  MockNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    this.isRead = false,
    this.imageUrl,
    required this.type,
  });
}
