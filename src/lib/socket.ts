import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/services/socket/types";

// Fallback to localhost:3001 for development
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (clerkUserId: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        userId: clerkUserId,
      },
      transports: ["websocket"],
      autoConnect: false, // Client should manually connect
    });
  } else {
    if (socket.auth && typeof socket.auth === "object") {
      (socket.auth as any).userId = clerkUserId;
    }
  }

  return socket;
};
