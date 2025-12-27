"use client";

import { ReactNode } from "react";
import Inbox from "@/shared/components/layout/Inbox";
import { useParams } from "next/navigation";

interface ChatClientLayoutProps {
  children: ReactNode;
}

export default function ChatClientLayout({ children }: ChatClientLayoutProps) {
  const params = useParams();
  const hasSelectedChat = !!params?.userId;

  return (
    <div className="flex h-screen overflow-hidden border-b-1 border-border">
      {/* Left Side - Inbox (Desktop) or Mobile when no chat selected */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-border bg-card flex-shrink-0 h-full ${
          hasSelectedChat ? "hidden md:block" : "block"
        }`}
      >
        <Inbox
          activeUserId={
            Array.isArray(params?.userId) ? params.userId[0] : params?.userId
          }
        />
      </div>
      {/* Right Side - Chat Content (Desktop) or Mobile when chat selected */}
      <div
        className={`flex-1 h-full overflow-hidden ${
          hasSelectedChat ? "block" : "hidden md:block"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
