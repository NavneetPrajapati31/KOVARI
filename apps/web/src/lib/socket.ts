import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@kovari/types";

// Fallback to localhost:3005 for development
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3005";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (clerkUserId: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: async (cb) => {
        let token = undefined;
        if (typeof window !== "undefined" && (window as any).Clerk?.session) {
          token = await (window as any).Clerk.session.getToken();
        }
        cb({ userId: clerkUserId, token });
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
    // In case clerkUserId changes, the auth callback above will capture the new token via Clerk's session,
    // but socket.io caches the auth object if it's not a function. Since it's a function now,
    // it will be called automatically on reconnect.
  }

  return socket;
};

