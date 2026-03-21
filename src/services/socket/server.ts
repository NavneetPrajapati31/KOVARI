import { Server } from "socket.io";
import { createServer } from "http";
import { registerSocketEvents } from "./events";
import { redisAdapter, connectRedis } from "./redis";
import { PresenceManager } from "./presence";
import { createAdminSupabaseClient } from "../../lib/supabase-admin";
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
  adapter: redisAdapter,
});

// Auth middleware — also resolve Supabase UUID once and cache in socket.data
io.use(async (socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error("Authentication error: userId missing"));
  }
  socket.data.userId = userId;

  // Resolve Supabase UUID and profile_photo once at connection (two queries, no join — avoids schema cache issues)
  try {
    const supabase = createAdminSupabaseClient();
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();
    const supabaseId = userRow?.id || null;
    socket.data.supabaseId = supabaseId;

    if (supabaseId) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("profile_photo")
        .eq("user_id", supabaseId)
        .single();
      (socket.data as any).profilePhoto = profileRow?.profile_photo || null;
    } else {
      (socket.data as any).profilePhoto = null;
    }
  } catch {
    socket.data.supabaseId = null;
    (socket.data as any).profilePhoto = null;
  }

  next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  const supabaseId = socket.data.supabaseId || null;
  console.log(`[Socket] User connected: ${userId} supabaseId: ${supabaseId} (Socket ID: ${socket.id})`);

  PresenceManager.userConnected(userId, socket.id);

  registerSocketEvents(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] User disconnected: ${userId} (Socket ID: ${socket.id}). Reason: ${reason}`);
    PresenceManager.userDisconnected(userId, socket.id, (cId, uId, lastSeen) => {
      io.to(cId).emit("user_offline", { userId: uId, supabaseId, lastSeen });
    });
  });
});

// Await Redis connection before accepting HTTP requests
connectRedis().then(async () => {
  // Clear stale socket presence data from any previous server run
  await PresenceManager.flushStalePresence();

  httpServer.listen(PORT, () => {
    console.log(`[Socket] Server listening on port ${PORT}`);
  });
});
