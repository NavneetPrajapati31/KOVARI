export interface ServerToClientEvents {
  receive_message: (message: any) => void;
  user_online: (payload: { userId: string; supabaseId?: string | null }) => void;
  user_offline: (payload: { userId: string; supabaseId?: string | null; lastSeen?: string | null }) => void;
  message_persisted: (payload: { tempId: string, messageId: string, chatId: string }) => void;
  
  // UX Features (Server -> Client)
  user_typing: (payload: { chatId: string; userId: string }) => void;
  user_stopped_typing: (payload: { chatId: string; userId: string }) => void;
  messages_seen: (payload: { chatId: string; messageIds: string[]; userId?: string; isFullySeen?: boolean }) => void;
  message_delivered_ack: (payload: { chatId: string; messageId: string; userId: string }) => void;
  user_last_seen: (payload: { userId: string; lastSeen: string | null }) => void;
}

export interface ClientToServerEvents {
  join_chat: (payload: { chatId: string }) => void;
  leave_chat: (payload: { chatId: string }) => void;
  send_message: (
    payload: { chatId: string; message: any },
    callback?: (response: { status: string; error?: string }) => void
  ) => void;

  // UX Features (Client -> Server)
  typing_start: (payload: { chatId: string }) => void;
  typing_stop: (payload: { chatId: string }) => void;
  mark_seen: (payload: { chatId: string; messageIds: string[] }) => void;
  message_delivered: (payload: { chatId: string; messageId: string }) => void;
  get_last_seen: (payload: { userId: string }, callback: (lastSeen: string | null) => void) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  supabaseId?: string | null;
}
