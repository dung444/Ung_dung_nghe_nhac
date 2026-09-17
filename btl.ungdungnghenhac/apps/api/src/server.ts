import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { initSocketServer } from "./socket/socket.server";

async function main() {
  // Test DB connection
  await prisma.$connect();
  console.log("✅ Database connected");

  const app = createApp();
  const httpServer = http.createServer(app);

  // Init Socket.io
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Waifu Player API running at http://localhost:${env.PORT}`);
    console.log(`📡 Socket.io ready`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
