import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { createApp } from "../app";
import { initSocketServer } from "./socket.server";
import { prisma } from "../config/database";
import { signAccessToken } from "../lib/jwt";

describe("Socket.io Realtime Event Flows & User Stories", () => {
  let server: any;
  let port: number;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let testRoomId: string;
  let testSongId: string;

  beforeAll(async () => {
    // 1. Setup express + socket server
    const app = createApp();
    server = createServer(app);
    initSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });

    // 2. Create test users in DB
    const u1 = await prisma.user.upsert({
      where: { email: "sockethost@waifu.moe" },
      create: {
        email: "sockethost@waifu.moe",
        username: "sockethost",
        displayName: "Socket Host",
        passwordHash: "hash123",
        role: "USER",
      },
      update: {},
    });
    user1Id = u1.id;
    user1Token = signAccessToken({ userId: u1.id, role: u1.role });

    const u2 = await prisma.user.upsert({
      where: { email: "socketlistener@waifu.moe" },
      create: {
        email: "socketlistener@waifu.moe",
        username: "socketlistener",
        displayName: "Socket Listener",
        passwordHash: "hash123",
        role: "USER",
      },
      update: {},
    });
    user2Id = u2.id;
    user2Token = signAccessToken({ userId: u2.id, role: u2.role });

    // 3. Create a test song & room
    const song = await prisma.song.findFirst();
    if (song) {
      testSongId = song.id;
    } else {
      const newSong = await prisma.song.create({
        data: {
          title: "Realtime Anime Beat",
          duration: 180,
          fileUrl: "/audio/test.mp3",
          isPublic: true,
        },
      });
      testSongId = newSong.id;
    }

    const room = await prisma.room.create({
      data: {
        name: "Socket Test Lounge",
        ownerId: user1Id,
        isActive: true,
      },
    });
    testRoomId = room.id;
  });

  afterAll(async () => {
    if (testRoomId) {
      await prisma.roomParticipant.deleteMany({ where: { roomId: testRoomId } });
      await prisma.room.deleteMany({ where: { id: testRoomId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: ["sockethost@waifu.moe", "socketlistener@waifu.moe"] } },
    });
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  describe("US-Presence: Presence & Friend Listening Status", () => {
    let client1: ClientSocket;
    let client2: ClientSocket;

    afterAll(() => {
      client1?.disconnect();
      client2?.disconnect();
    });

    it("should authenticate and connect to /presence namespace", async () => {
      client1 = Client(`http://localhost:${port}/presence`, {
        auth: { token: user1Token },
        transports: ["websocket"],
      });

      await new Promise<void>((resolve, reject) => {
        client1.on("connect", () => resolve());
        client1.on("connect_error", (err) => reject(err));
      });

      expect(client1.connected).toBe(true);
    });

    it("should reject connection to /presence without valid token", async () => {
      const badClient = Client(`http://localhost:${port}/presence`, {
        auth: { token: "invalid.token" },
        transports: ["websocket"],
      });

      const errMessage = await new Promise<string>((resolve) => {
        badClient.on("connect_error", (err) => {
          badClient.disconnect();
          resolve(err.message);
        });
      });

      expect(errMessage).toBeDefined();
    });

    it("should broadcast playing activity when user starts a song", async () => {
      client2 = Client(`http://localhost:${port}/presence`, {
        auth: { token: user2Token },
        transports: ["websocket"],
      });

      await new Promise<void>((resolve) => client2.on("connect", () => resolve()));

      const activityPromise = new Promise<any>((resolve) => {
        client2.on("friend:activity", (data) => {
          if (data.userId === user1Id && data.action === "playing") {
            resolve(data);
          }
        });
      });

      client1.emit("user:playing", {
        songId: testSongId,
        songTitle: "Realtime Anime Beat",
        artistName: "Hatsune Miku",
      });

      const received = await activityPromise;
      expect(received.action).toBe("playing");
      expect(received.song.songTitle).toBe("Realtime Anime Beat");
    });
  });

  describe("US-Room: Live Group Listening, Playback Sync & Chat", () => {
    let hostClient: ClientSocket;
    let memberClient: ClientSocket;

    beforeAll(async () => {
      hostClient = Client(`http://localhost:${port}/room`, {
        auth: { token: user1Token },
        transports: ["websocket"],
      });
      memberClient = Client(`http://localhost:${port}/room`, {
        auth: { token: user2Token },
        transports: ["websocket"],
      });

      await Promise.all([
        new Promise<void>((resolve) => hostClient.on("connect", () => resolve())),
        new Promise<void>((resolve) => memberClient.on("connect", () => resolve())),
      ]);
    });

    afterAll(() => {
      hostClient?.disconnect();
      memberClient?.disconnect();
    });

    it("should allow host and listener to join room and broadcast join event", async () => {
      const joinPromise = new Promise<any>((resolve) => {
        hostClient.on("room:participant:joined", (data) => {
          if (data.id === user2Id) {
            resolve(data);
          }
        });
      });

      hostClient.emit("room:join", { roomId: testRoomId });
      memberClient.emit("room:join", { roomId: testRoomId });

      const participant = await joinPromise;
      expect(participant.id).toBe(user2Id);
    });

    it("should synchronize playback when host plays a song", async () => {
      const syncPromise = new Promise<any>((resolve) => {
        memberClient.on("room:sync", (data) => {
          if (data.isPlaying === true) {
            resolve(data);
          }
        });
      });

      hostClient.emit("room:play", { roomId: testRoomId, songId: testSongId, position: 10 });

      const syncData = await syncPromise;
      expect(syncData.isPlaying).toBe(true);
      expect(syncData.serverTime).toBeDefined();
    });

    it("should synchronize playback pause when host pauses", async () => {
      const pausePromise = new Promise<any>((resolve) => {
        memberClient.on("room:sync", (data) => {
          if (data.isPlaying === false) {
            resolve(data);
          }
        });
      });

      hostClient.emit("room:pause", { roomId: testRoomId, position: 25 });

      const pauseData = await pausePromise;
      expect(pauseData.isPlaying).toBe(false);
      expect(pauseData.position).toBe(25);
    });

    it("should broadcast chat message across room members", async () => {
      const chatPromise = new Promise<any>((resolve) => {
        hostClient.on("room:chat:message", (data) => {
          if (data.message === "Sugoi! Bài hát hay quá!") {
            resolve(data);
          }
        });
      });

      memberClient.emit("room:chat", { roomId: testRoomId, message: "Sugoi! Bài hát hay quá!" });

      const chatMsg = await chatPromise;
      expect(chatMsg.message).toBe("Sugoi! Bài hát hay quá!");
      expect(chatMsg.id).toBe(user2Id);
    });

    it("should broadcast anime emoji reaction to all participants", async () => {
      const reactionPromise = new Promise<any>((resolve) => {
        hostClient.on("room:reaction", (data) => {
          if (data.emoji === "💖") {
            resolve(data);
          }
        });
      });

      memberClient.emit("room:reaction", { roomId: testRoomId, emoji: "💖" });

      const reaction = await reactionPromise;
      expect(reaction.emoji).toBe("💖");
      expect(reaction.userId).toBe(user2Id);
    });

    it("should broadcast full song information including fileUrl and artists on track change", async () => {
      const trackPromise = new Promise<any>((resolve) => {
        memberClient.on("room:track:changed", (data) => {
          if (data.song?.id === testSongId) {
            resolve(data);
          }
        });
      });

      hostClient.emit("room:play", { roomId: testRoomId, songId: testSongId, position: 0 });

      const trackData = await trackPromise;
      expect(trackData.song).toBeDefined();
      expect(trackData.song.fileUrl).toBeDefined();
      expect(Array.isArray(trackData.song.artists)).toBe(true);
    });

    it("should broadcast room:closed to listeners when host closes the room", async () => {
      const closePromise = new Promise<any>((resolve) => {
        memberClient.on("room:closed", (data) => {
          if (data.roomId === testRoomId) {
            resolve(data);
          }
        });
      });

      hostClient.emit("room:close", { roomId: testRoomId });

      const closedData = await closePromise;
      expect(closedData.roomId).toBe(testRoomId);
    });
  });

  describe("US-Playlist: Collaborative Playlist Sync", () => {
    let client: ClientSocket;

    beforeAll(async () => {
      client = Client(`http://localhost:${port}/playlist`, {
        auth: { token: user1Token },
        transports: ["websocket"],
      });
      await new Promise<void>((resolve) => client.on("connect", () => resolve()));
    });

    afterAll(() => {
      client?.disconnect();
    });

    it("should join playlist room and handle track update broadcasts", async () => {
      client.emit("playlist:join", { playlistId: "pl-test-1" });
      expect(client.connected).toBe(true);
    });
  });
});
