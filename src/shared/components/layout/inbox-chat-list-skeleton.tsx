import { Skeleton } from "@heroui/react";

const SKELETON_COUNT = 8;

const InboxChatListSkeleton = () => (
  <div
    className="flex-1 bg-card overflow-y-auto scrollbar-hide flex flex-col"
    aria-busy="true"
    aria-label="Loading conversations"
  >
    {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
      <div
        key={idx}
        className={`flex items-center px-4 py-3 border-b border-border animate-pulse`}
      >
        {/* Avatar Skeleton */}
        <Skeleton className="h-12 w-12 rounded-full mr-3 bg-gray-200" />
        {/* Message Content Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-24 rounded bg-gray-200" />
            <Skeleton className="h-3 w-10 rounded bg-gray-200" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32 rounded bg-gray-200" />
            {/* <Skeleton className="h-4 w-6 rounded-full bg-gray-200 ml-2" /> */}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default InboxChatListSkeleton;
