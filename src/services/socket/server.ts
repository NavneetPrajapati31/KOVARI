import { Server } from "socket.io";
import { createServer } from "http";
import { registerSocketEvents } from "./events";
import { redisAdapter, connectRedis } from "./redis";
import { PresenceManager } from "./presence";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";
import dotenv from "dotenv";

// Load environment variables since this is a standalone Node process
dotenv.config({ path: ".env.local" });
dotenv.config();

const PORT = 3001;

const httpServer = createServer();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
  adapter: redisAdapter, // Attach the Redis Adapter for cross-node multi-instance broadcasting
});

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error("Authentication error: userId missing"));
  }
  
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log(`[Socket] User connected: ${userId} (Socket ID: ${socket.id})`);

  // Handle presence natively on connect
  PresenceManager.userConnected(userId, socket.id);

  registerSocketEvents(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] User disconnected: ${userId} (Socket ID: ${socket.id}). Reason: ${reason}`);
    PresenceManager.userDisconnected(userId, socket.id, (cId, uId) => {
      io.to(cId).emit("user_offline", { userId: uId });
    });
  });
});

// Await Redis connection before accepting HTTP requests
connectRedis().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[Socket] Server listening on port ${PORT}`);
  });
});
