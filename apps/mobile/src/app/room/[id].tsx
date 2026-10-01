import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { api } from "../../services/api";
import { useRoomStore } from "../../store/roomStore";
import { usePlayerStore } from "../../store/playerStore";
import { useAuthStore } from "../../store/authStore";
import { useRoomSocket } from "../../hooks/useSocket";
import { ProgressBar } from "../../features/player/components/ProgressBar";
import { formatDuration } from "@waifu-player/utils";
import type { Room } from "@waifu-player/types";

const ANIME_REACTIONS = ["💖", "🔥", "✨", "🎧", "🌸", "⭐", "🎉"];

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(id) ? id[0] : id;

  const { user } = useAuthStore();
  const { activeRoom, participants, currentSong: roomSong, isPlaying: roomPlaying, position: roomPosition, setRoom, leaveRoom } = useRoomStore();
  const { setCurrentSong, setPlaying, seekTo } = usePlayerStore();

  const [reactions, setReactions] = useState<{ id: string; emoji: string; user: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect socket for this room
  const socketRef = useRoomSocket(roomId);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);

    api
      .get(`/api/v1/rooms/${roomId}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const room: Room = res.data.data;
          setRoom(room, user?.id || "");
          if (room.currentSong) {
            setCurrentSong(room.currentSong);
          }
        }
      })
      .catch(() => {
        // Fallback room session
        const mockRoom: Room = {
          id: roomId,
          name: "Vocaloid Anime Lounge 🌸",
          isActive: true,
          ownerId: "host-1",
          owner: { id: "host-1", username: "MikuFanClub", avatarUrl: null },
          currentSongId: "s1",
          currentSong: {
            id: "s1",
            title: "World is Mine",
            duration: 225,
            fileUrl: "/uploads/audio/world_is_mine.mp3",
            coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
            plays: 420000,
            isPublic: true,
            releaseDate: "2023-03-09",
            albumId: "a1",
            artists: [{ id: "art1", name: "Hatsune Miku", bio: null, avatarUrl: null, verified: true, userId: null, createdAt: "", updatedAt: "" }],
            genres: [{ id: "g1", name: "Vocaloid", slug: "vocaloid" }],
            createdAt: "",
            updatedAt: "",
          },
          participants: [
            { roomId, userId: "u1", joinedAt: "", user: { id: "u1", username: "HoloFan", avatarUrl: null } },
            { roomId, userId: "u2", joinedAt: "", user: { id: "u2", username: "RemBestGirl", avatarUrl: null } },
          ],
          createdAt: "",
        };
        setRoom(mockRoom, user?.id || "");
        if (mockRoom.currentSong) {
          setCurrentSong(mockRoom.currentSong);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      leaveRoom();
    };
  }, [roomId]);

  const handleSyncNow = () => {
    if (roomPosition >= 0) {
      seekTo(roomPosition);
      setPlaying(roomPlaying);
      Alert.alert("Đã đồng bộ", `Đã đồng bộ âm thanh tới ${formatDuration(roomPosition)} cùng phòng nghe.`);
    }
  };

  const handleSendReaction = (emoji: string) => {
    const newReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      user: user?.username || "Bạn",
    };
    setReactions((prev) => [newReaction, ...prev.slice(0, 8)]);
    socketRef.current?.emit("room:reaction", { roomId, emoji });
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.back();
  };

  const song = roomSong || activeRoom?.currentSong;
  const isHost = activeRoom?.ownerId === user?.id;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE ROOM</Text>
          </View>
          <Text style={styles.roomName} numberOfLines={1}>
            {activeRoom?.name || "Phòng nghe chung"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSyncNow} style={styles.syncBtn}>
          <Ionicons name="sync" size={20} color={Colors.dark.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Currently Playing in Room */}
        <View style={styles.playerCard}>
          <Text style={styles.playerCardLabel}>ĐANG PHÁT CÙNG NHAU 🎧</Text>
          {song?.coverUrl ? (
            <Image source={{ uri: song.coverUrl }} style={styles.songCover} />
          ) : (
            <View style={[styles.songCover, styles.coverFallback]}>
              <Ionicons name="musical-notes" size={50} color={Colors.dark.primary} />
            </View>
          )}

          <Text style={styles.songTitle} numberOfLines={1}>
            {song?.title || "Chưa phát bài nào"}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {song?.artists?.map((a) => a.name).join(", ") || "Waifu Lounge"}
          </Text>

          {song && (
            <View style={styles.progressContainer}>
              <ProgressBar
                position={roomPosition}
                duration={song.duration}
                onSeek={(val) => {
                  if (isHost) {
                    seekTo(val);
                    socketRef.current?.emit("room:seek", { roomId, position: val });
                  } else {
                    seekTo(val);
                  }
                }}
              />
            </View>
          )}

          <TouchableOpacity style={styles.syncActionBtn} onPress={handleSyncNow}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.syncActionText}>Đồng bộ tức thì với chủ phòng</Text>
          </TouchableOpacity>
        </View>

        {/* Reaction Bar */}
        <View style={styles.reactionBar}>
          <Text style={styles.reactionTitle}>Thả cảm xúc waifu ✨</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {ANIME_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionBubble}
                onPress={() => handleSendReaction(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Active Reactions Stream */}
        {reactions.length > 0 && (
          <View style={styles.reactionStream}>
            {reactions.slice(0, 4).map((r) => (
              <View key={r.id} style={styles.reactionTag}>
                <Text style={styles.reactionUser}>{r.user}:</Text>
                <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Thành viên trong phòng ({participants.length + 1})
            </Text>
          </View>

          {/* Host */}
          <View style={styles.participantItem}>
            <View style={[styles.avatarBox, styles.hostAvatarBox]}>
              <Ionicons name="star" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.participantName}>
                {activeRoom?.owner?.username || "Chủ phòng"}
              </Text>
              <Text style={styles.participantRole}>👑 Chủ phòng (Host)</Text>
            </View>
          </View>

          {/* Others */}
          {participants.map((p, idx) => (
            <View key={p.userId || idx} style={styles.participantItem}>
              <View style={styles.avatarBox}>
                <Ionicons name="person" size={16} color={Colors.dark.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.participantName}>
                  {p.user?.username || `Thành viên #${idx + 1}`}
                </Text>
                <Text style={styles.participantRole}>Đang lắng nghe</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    padding: 6,
  },
  topBarCenter: {
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.secondary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.dark.secondary,
    letterSpacing: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  playerCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  playerCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.dark.primaryLight,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  songCover: {
    width: 160,
    height: 160,
    borderRadius: 14,
    marginBottom: 14,
  },
  coverFallback: {
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
  },
  songTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginBottom: 14,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 12,
  },
  syncActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: 6,
  },
  syncActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  reactionBar: {
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  reactionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.textMuted,
    marginBottom: 10,
  },
  reactionBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionStream: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  reactionTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionUser: {
    color: Colors.dark.primaryLight,
    fontSize: 12,
    fontWeight: "600",
  },
  participantsSection: {
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hostAvatarBox: {
    backgroundColor: Colors.dark.primary,
  },
  participantName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },
  participantRole: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
