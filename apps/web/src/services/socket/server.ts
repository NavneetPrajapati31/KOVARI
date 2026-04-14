import { Server } from "socket.io";
import { createServer } from "http";
import { registerSocketEvents } from "./events";
import { redisAdapter, connectRedis } from "./redis";
import { PresenceManager } from "./presence";
import { createAdminSupabaseClient } from "@kovari/api";
import {
  InterServerEvents,
  SocketData,
  ClientToServerEvents,
  ServerToClientEvents
} from "@kovari/types";
import dotenv from "dotenv";

// Load environment variables since this is a standalone Node process
dotenv.config({ path: ".env.local" });
dotenv.config();

const PORT = process.env.PORT || 3005;

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Socket server running');
  }
});

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://kovari.in",
      "https://www.kovari.in"
    ],
    methods: ["GET", "POST"],
    credentials: true,
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
        .select("profile_photo, name, username")
        .eq("user_id", supabaseId)
        .single();
      
      (socket.data as any).profilePhoto = profileRow?.profile_photo || null;
      (socket.data as any).fullName = profileRow?.name || profileRow?.username || "Someone";
    } else {
      (socket.data as any).profilePhoto = null;
      (socket.data as any).fullName = "Someone";
    }
  } catch (err) {
    console.error("[Socket Auth] Supabase lookup failed — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars:", err);
    socket.data.supabaseId = null;
    (socket.data as any).profilePhoto = null;
    (socket.data as any).fullName = "Someone";
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

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Socket] Server listening on port 3005 at 0.0.0.0`);
  });
});

