import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@kovari/types";

// Fallback to localhost:3005 for development
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3005";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (clerkUserId: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        userId: clerkUserId,
      },
      transports: ["polling", "websocket"], // polling first so cloud proxies can upgrade properly
      autoConnect: false, // Client should manually connect
    });

    socket.on("connect_error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[Socket] Connection error:", err.message, "| URL:", SOCKET_URL);
      }
    });
  } else {
    if (socket.auth && typeof socket.auth === "object") {
      (socket.auth as any).userId = clerkUserId;
    }
  }

  return socket;
};

