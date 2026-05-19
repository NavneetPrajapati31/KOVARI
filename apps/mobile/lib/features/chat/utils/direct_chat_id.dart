/// Deterministic room id for a 1:1 chat (same as `getDirectChatId` in `@kovari/api`).
String directChatId(String userUuidA, String userUuidB) {
  final sorted = [userUuidA, userUuidB]..sort();
  return '${sorted[0]}_${sorted[1]}';
}

/// Other participant's user id from a direct [chatId], given [myUserId] and optionally [myUserUuid].
String? directChatPartnerId(String chatId, String myUserId, {String? myUserUuid}) {
  final parts = chatId.split('_');
  if (parts.length != 2) return null;
  
  // Check against Database UUID if provided
  if (myUserUuid != null) {
    if (parts[0] == myUserUuid) return parts[1];
    if (parts[1] == myUserUuid) return parts[0];
  }

  // Check against Clerk ID (Legacy fallback)
  if (parts[0] == myUserId) return parts[1];
  if (parts[1] == myUserId) return parts[0];
  
  return null;
}
