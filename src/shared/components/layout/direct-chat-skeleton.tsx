import { Skeleton } from "@heroui/react";
import { Send, Smile } from "lucide-react";

const SKELETON_COUNT = 16;

const SKELETON_SEQUENCE = [
  { type: "sent", count: 2, widths: ["w-28", "w-40"] },
  { type: "received", count: 2, widths: ["w-28", "w-40"] },
  { type: "sent", count: 2, widths: ["w-28", "w-40"] },
  { type: "received", count: 2, widths: ["w-28", "w-40"] },
  { type: "sent", count: 2, widths: ["w-28", "w-40"] },
  { type: "received", count: 2, widths: ["w-28", "w-40"] },
  { type: "sent", count: 2, widths: ["w-28", "w-40"] },
  { type: "received", count: 2, widths: ["w-28", "w-40"] },
  { type: "sent", count: 2, widths: ["w-28", "w-40"] },
  //   { type: "received", count: 1, width: "w-36" },
  //   { type: "sent", count: 2, widths: ["w-28", "w-40"] },
  //   { type: "received", count: 2, widths: ["w-28", "w-40"] },
];

const DirectChatSkeleton = () => (
  <div className="relative h-full bg-card animate-pulse">
    {/* Header Skeleton */}
    <div className="absolute top-0 left-0 right-0 px-3 sm:px-5 py-3 border-b border-border bg-card z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          {/* <Skeleton
            className="md:hidden h-5 w-5 rounded-full bg-gray-200"
            aria-label="Back button skeleton"
          /> */}
          {/* Avatar */}
          <Skeleton
            className="w-10 h-10 rounded-full bg-gray-200"
            aria-label="Avatar skeleton"
          />
          <div>
            <Skeleton
              className="h-3 w-24 mb-2 rounded bg-gray-200"
              aria-label="Name skeleton"
            />
            <Skeleton
              className="h-3 w-16 rounded bg-gray-200"
              aria-label="Username skeleton"
            />
          </div>
        </div>
        {/* Menu icon */}
        {/* <Skeleton
          className="h-5 w-5 rounded-full bg-gray-200"
          aria-label="Menu skeleton"
        /> */}
      </div>
    </div>

    {/* Messages Skeleton */}
    <div
      className="absolute top-16 bottom-10 left-0 right-0 overflow-hidden p-4 mb-2 max-h-[80vh] space-y-1 bg-card"
      aria-label="Chat messages skeleton"
      tabIndex={0}
    >
      <div className="text-center flex justify-center items-center mb-5">
        <Skeleton className="px-3 py-1 rounded-full text-xs w-16 h-4 bg-gray-200" />
      </div>

      {SKELETON_SEQUENCE.map((group, groupIdx) =>
        Array.from({ length: group.count }).map((_, msgIdx) => (
          <div
            key={`group-${groupIdx}-msg-${msgIdx}`}
            className={`flex ${group.type === "sent" ? "justify-end" : "justify-start"} mb-0.5`}
            aria-label={
              group.type === "sent"
                ? "Sent message skeleton"
                : "Received message skeleton"
            }
          >
            <div
              className={`relative max-w-[75%] ${group.type === "sent" ? "flex-row-reverse" : "flex-row"} flex items-end gap-2`}
            >
              <Skeleton
                className={`rounded-2xl text-xs h-6 bg-gray-200 ${
                  group.widths ? (group.widths[msgIdx] ?? "w-32") : "w-32"
                }`}
              />
            </div>
          </div>
        ))
      )}
    </div>

    {/* Message Input Skeleton */}
    {/* <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-1 shadow-none z-10">
      <div className="flex items-center space-x-1 relative">
        <Skeleton
          className="flex-1 h-10 rounded-full bg-gray-200"
          aria-label="Input skeleton"
        />
        <Skeleton
          className="h-8 w-8 rounded-full bg-gray-200"
          aria-label="Emoji button skeleton"
        />
        <Skeleton
          className="h-8 w-8 rounded-full bg-gray-200"
          aria-label="Send button skeleton"
        />
      </div>
    </div> */}

    {/* Message Input - Always at Bottom */}
    <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-1 shadow-none z-10">
      <div className="flex items-center space-x-1 relative">
        <div className="flex-1 relative h-auto flex items-center bg-transparent hover:cursor-text">
          <textarea
            placeholder="Your message"
            className="w-full h-full px-4 py-3 rounded-none border-none bg-transparent text-xs focus:outline-none resize-none max-h-20 overflow-y-auto scrollbar-hide align-middle"
            aria-label="Type your message"
            rows={1}
            tabIndex={0}
            style={{ lineHeight: "1.5" }}
          />
        </div>
        <button
          type="button"
          className="rounded-full bg-transparent hover:bg-primary/10 text-primary flex items-center justify-center p-2 focus:outline-none focus:ring-0"
          aria-label="Open emoji picker"
          tabIndex={0}
        >
          <Smile className="h-5 w-5" />
        </button>

        <button
          className="rounded-full bg-transparent hover:bg-primary/90 text-primary disabled:opacity-50 flex items-center justify-center hover:cursor-pointer pr-3"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
);

export default DirectChatSkeleton;
