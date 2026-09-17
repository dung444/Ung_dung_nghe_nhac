import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { usePlayerStore } from "../../store/playerStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressBar } from "../../features/player/components/ProgressBar";
import { seekToPosition } from "../../services/audioPlayer";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, cancelAnimation } from "react-native-reanimated";

export default function SongDetailScreen() {
  const router = useRouter();
  const [position, setPosition] = useState(0);
  const { currentSong, isPlaying, setPlaying, playNext, playPrev, shuffleEnabled, toggleShuffle, repeatMode, setRepeatMode } = usePlayerStore();
  
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1, // infinite repeat
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  if (!currentSong) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.dark.text }}>Chưa có bài hát nào đang phát.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.dark.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRepeatToggle = () => {
    if (repeatMode === "off") setRepeatMode("queue");
    else if (repeatMode === "queue") setRepeatMode("track");
    else setRepeatMode("off");
  };

  const getRepeatIcon = () => {
    if (repeatMode === "track") return "repeat-outline"; // normally has a 1 inside but using standard icon
    return "repeat";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={32} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đang phát</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.artworkContainer}>
        {currentSong.coverUrl ? (
          <Animated.Image source={{ uri: currentSong.coverUrl }} style={[styles.artwork, animatedStyle]} />
        ) : (
          <Animated.View style={[styles.artwork, styles.artworkFallback, animatedStyle]}>
            <Ionicons name="musical-note" size={80} color={Colors.dark.primary} />
          </Animated.View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentSong.artists?.map(a => a.name).join(", ")}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={28} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        <ProgressBar
          position={position}
          duration={currentSong.duration}
          onSeek={(val) => {
            setPosition(val);
            seekToPosition(val).catch(() => {});
          }}
        /> 

        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={toggleShuffle}>
            <Ionicons name="shuffle" size={28} color={shuffleEnabled ? Colors.dark.primary : Colors.dark.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={playPrev}>
            <Ionicons name="play-skip-back" size={40} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playBtn} onPress={() => setPlaying(!isPlaying)}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" style={{ marginLeft: isPlaying ? 0 : 4 }} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={playNext}>
            <Ionicons name="play-skip-forward" size={40} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleRepeatToggle}>
            <Ionicons name={getRepeatIcon()} size={28} color={repeatMode !== "off" ? Colors.dark.primary : Colors.dark.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.playerBg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.dark.text, textTransform: "uppercase", letterSpacing: 1 },
  artworkContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  artwork: { width: 300, height: 300, borderRadius: 150, borderWidth: 8, borderColor: Colors.dark.surface },
  artworkFallback: { backgroundColor: Colors.dark.card, justifyContent: "center", alignItems: "center" },
  infoContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.dark.text, marginBottom: 4 },
  artist: { fontSize: 18, color: Colors.dark.textMuted },
  controlsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.primary, justifyContent: "center", alignItems: "center" },
});
