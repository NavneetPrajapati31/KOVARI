import UserCard from "./user-card";
import type { User } from "@/features/profile/lib/user"; // Import the User interface

interface UserListProps {
  users: User[];
  type: "followers" | "following";
  onRemove?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onFollowBack?: (userId: number) => void;
}

export default function UserList({
  users,
  type,
  onRemove,
  onUnfollow,
  onFollowBack,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-gray-400 text-center">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
            {type === "followers" ? "No followers yet" : "Not following anyone"}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500">
            {type === "followers"
              ? "When people follow you, you'll see them here."
              : "When you follow people, you'll see them here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          type={type}
          onRemove={onRemove}
          onUnfollow={onUnfollow}
          onFollowBack={onFollowBack}
        />
      ))}
    </div>
  );
}
