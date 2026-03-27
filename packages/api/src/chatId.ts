/**
 * Utility to deterministically generate a unified chatId for both Direct and Group chats.
 */

/**
 * Generates a unified chatId for direct chats.
 * Sorts the UUIDs lexicographically so that A+B and B+A always yield the exact same sequence.
 */
export function getDirectChatId(userUuidA: string, userUuidB: string): string {
  const sorted = [userUuidA, userUuidB].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Generates a unified chatId for group chats.
 * Simply returns the groupId since group IDs are already unique across groups.
 */
export function getGroupChatId(groupId: string): string {
  return groupId;
}
