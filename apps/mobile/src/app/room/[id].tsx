import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
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
import type { Room, Song } from "@waifu-player/types";

const ANIME_REACTIONS = ["💖", "🔥", "✨", "🎧", "🌸", "⭐", "🎉"];

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(id) ? id[0] : id;

  const { user } = useAuthStore();
  const {
    activeRoom,
    participants,
    currentSong: roomSong,
    isPlaying: roomPlaying,
    position: roomPosition,
    setRoom,
    leaveRoom,
  } = useRoomStore();

  const { setCurrentSong, setPlaying, seekTo } = usePlayerStore();

  const [reactions, setReactions] = useState<{ id: string; emoji: string; user: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Host Change Song Modal
  const [showSongModal, setShowSongModal] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState("");

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

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const handleReaction = (data: any) => {
      if (data?.emoji) {
        setReactions((prev) => [data, ...prev.slice(0, 8)]);
      }
    };

    s.on("room:reaction", handleReaction);

    return () => {
      s.off("room:reaction", handleReaction);
    };
  }, [socketRef.current]);

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

  const handleOpenSongModal = () => {
    setShowSongModal(true);
    api.get("/api/v1/songs").then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAvailableSongs(res.data.data);
      }
    }).catch(() => {});
  };

  const handleSelectSongForRoom = (selectedSong: Song) => {
    setCurrentSong(selectedSong);
    socketRef.current?.emit("room:play", {
      roomId,
      songId: selectedSong.id,
      position: 0,
    });
    setShowSongModal(false);
  };

  const handleTogglePlayPauseHost = () => {
    if (!isHost) return;
    if (roomPlaying) {
      socketRef.current?.emit("room:pause", { roomId, position: roomPosition });
      setPlaying(false);
    } else {
      if (song) {
        socketRef.current?.emit("room:play", { roomId, songId: song.id, position: roomPosition });
        setPlaying(true);
      }
    }
  };

  const handleCloseRoom = () => {
    Alert.alert("Đóng phòng nghe", "Bạn có chắc muốn đóng phòng nghe này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đóng phòng",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/v1/rooms/${roomId}`);
            leaveRoom();
            router.back();
          } catch {
            leaveRoom();
            router.back();
          }
        },
      },
    ]);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.back();
  };

  const song = roomSong || activeRoom?.currentSong;
  const isHost = activeRoom?.ownerId === user?.id || !activeRoom?.ownerId;

  const filteredSongs = availableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
      s.artists?.some((a) => a.name.toLowerCase().includes(songSearchQuery.toLowerCase()))
  );

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
        {isHost ? (
          <TouchableOpacity onPress={handleCloseRoom} style={styles.syncBtn}>
            <Ionicons name="power" size={20} color={Colors.dark.secondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSyncNow} style={styles.syncBtn}>
            <Ionicons name="sync" size={20} color={Colors.dark.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Currently Playing in Room */}
        <View style={styles.playerCard}>
          <View style={styles.playerTopMeta}>
            <Text style={styles.playerCardLabel}>ĐANG PHÁT CÙNG NHAU 🎧</Text>
            {isHost && (
              <TouchableOpacity onPress={handleOpenSongModal} style={styles.changeSongBadge}>
                <Ionicons name="swap-horizontal" size={14} color="#fff" />
                <Text style={styles.changeSongBadgeText}>Đổi bài</Text>
              </TouchableOpacity>
            )}
          </View>

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

          {/* Host Play/Pause Controls */}
          {isHost ? (
            <View style={styles.hostControlRow}>
              <TouchableOpacity style={styles.hostPlayPauseBtn} onPress={handleTogglePlayPauseHost}>
                <Ionicons
                  name={roomPlaying ? "pause-circle" : "play-circle"}
                  size={48}
                  color={Colors.dark.primary}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.syncActionBtn} onPress={handleSyncNow}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.syncActionText}>Đồng bộ tức thì với chủ phòng</Text>
            </TouchableOpacity>
          )}
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

      {/* Modal: Host Pick/Change Song */}
      <Modal
        visible={showSongModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSongModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn bài hát phát cho phòng 🎶</Text>
              <TouchableOpacity onPress={() => setShowSongModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBar}>
              <Ionicons name="search" size={18} color={Colors.dark.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Tìm bài hát..."
                placeholderTextColor={Colors.dark.textMuted}
                value={songSearchQuery}
                onChangeText={setSongSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredSongs.length === 0 ? (
                <Text style={styles.modalEmptyText}>Không tìm thấy bài hát phù hợp.</Text>
              ) : (
                filteredSongs.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.modalSongRow}
                    onPress={() => handleSelectSongForRoom(s)}
                  >
                    <Image
                      source={{ uri: s.coverUrl ?? "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" }}
                      style={styles.modalSongThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalSongTitle} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={styles.modalSongArtist} numberOfLines={1}>
                        {s.artists?.map((a) => a.name).join(", ") || "Unknown"}
                      </Text>
                    </View>
                    <Ionicons name="play" size={20} color={Colors.dark.primary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  playerTopMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  playerCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.dark.primaryLight,
    letterSpacing: 1.2,
  },
  changeSongBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changeSongBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
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
  hostControlRow: {
    alignItems: "center",
    marginTop: 6,
  },
  hostPlayPauseBtn: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalSearchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
  },
  modalEmptyText: {
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginVertical: 20,
  },
  modalSongRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalSongThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  modalSongTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  modalSongArtist: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
});
