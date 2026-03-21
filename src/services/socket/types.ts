export interface ServerToClientEvents {
  receive_message: (message: any) => void;
  user_online: (payload: { userId: string }) => void;
  user_offline: (payload: { userId: string }) => void;
  message_persisted: (payload: { tempId: string, messageId: string, chatId: string }) => void;
}

export interface ClientToServerEvents {
  join_chat: (payload: { chatId: string }) => void;
  leave_chat: (payload: { chatId: string }) => void;
  send_message: (
    payload: {
      chatId: string;
      message: {
        id?: string;
        tempId?: string;
        senderId: string;
        encryptedContent: string;
        iv: string;
        salt: string;
        mediaUrl?: string;
        mediaType?: "image" | "video";
        createdAt: string;
        isEncrypted?: boolean;
        senderName?: string;
        senderUsername?: string;
        avatar?: string;
      };
    },
    callback?: (response: { status: "sent" | "error"; error?: string }) => void
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
}
