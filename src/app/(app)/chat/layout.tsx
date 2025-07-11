import { ReactNode } from "react";
import ChatClientLayout from "./chat-client-layout";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return <ChatClientLayout>{children}</ChatClientLayout>;
}
