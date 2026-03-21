import { Server } from "socket.io";
import { createServer } from "http";
import { registerSocketEvents } from "./events";
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
  console.log(`[Socket] User connected: ${socket.data.userId} (Socket ID: ${socket.id})`);

  registerSocketEvents(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] User disconnected: ${socket.data.userId} (Socket ID: ${socket.id}). Reason: ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket] Server listening on port ${PORT}`);
});
