export interface User {
  id: number;
  username: string;
  name: string;
  avatar: string;
  isFollowing?: boolean; // Optional, as it might only apply to followers list
}
