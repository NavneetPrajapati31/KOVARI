"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useDirectInbox } from "@/shared/hooks/use-direct-inbox";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

const ChatInboxPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentUserUuid, setCurrentUserUuid] = useState<string>("");
  const { conversations, loading } = useDirectInbox(currentUserUuid);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    getUserUuidByClerkId(user.id).then((uuid) =>
      setCurrentUserUuid(uuid || "")
    );
  }, [user?.id]);

  console.log(
    "[ChatInboxPage] currentUserUuid:",
    currentUserUuid,
    "conversations:",
    conversations
  );

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <span className="text-muted-foreground">Loading conversations...</span>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <span className="text-muted-foreground">No conversations yet.</span>
      </div>
    );
  }

  return (
    <main className="max-w-full py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <ul className="divide-y divide-border rounded-lg border bg-card">
        {conversations.map((conv) => (
          <li key={conv.userId}>
            <Link
              href={`/chat/${conv.userId}`}
              className="flex items-center justify-between p-4 focus:bg-accent rounded transition-colors outline-none"
              tabIndex={0}
              aria-label={`Open chat with user ${conv.userId}`}
            >
              <span className="font-medium">User: {conv.userId}</span>
              <span className="text-sm text-muted-foreground truncate max-w-xs">
                {conv.lastMessage}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(conv.lastMessageAt).toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default ChatInboxPage;
