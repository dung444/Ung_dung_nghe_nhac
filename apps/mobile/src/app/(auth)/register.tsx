import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import type { Artist } from "@waifu-player/types";

const GENRE_OPTIONS = [
  { id: "vocaloid", name: "Vocaloid", emoji: "🌸", desc: "Hatsune Miku, Kagamine Rin/Len, Megurine Luka" },
  { id: "anisong", name: "Anisong (Anime OST)", emoji: "⚡", desc: "Kimetsu no Yaiba, Sword Art Online, Jujutsu Kaisen" },
  { id: "jpop", name: "J-Pop & Utaite", emoji: "🎤", desc: "YOASOBI, Ado, Eve, ZUTOMAYO, Yorushika" },
  { id: "lofi", name: "Lo-fi & Chill Anime", emoji: "☕", desc: "Ghibli Lofi beats, Midnight study anime vibes" },
  { id: "jrock", name: "J-Rock & Heavy", emoji: "🎸", desc: "LiSA, ONE OK ROCK, RADWIMPS, King Gnu" },
  { id: "symphony", name: "Epic Anime Symphony", emoji: "🎻", desc: "Sawano Hiroyuki, Yuki Kajiura, Joe Hisaishi" },
];

const ARTIST_OPTIONS = [
  { id: "art1", name: "Hatsune Miku", genre: "Vocaloid", avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80" },
  { id: "art2", name: "LiSA", genre: "Anisong Diva", avatar: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&q=80" },
  { id: "art3", name: "YOASOBI", genre: "J-Pop Story", avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80" },
  { id: "art4", name: "Ado", genre: "Utaite Legend", avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80" },
  { id: "art5", name: "Aimer", genre: "Mystic Vocals", avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&q=80" },
  { id: "art6", name: "RADWIMPS", genre: "Anime Rock", avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80" },
  { id: "art7", name: "Sawano Hiroyuki", genre: "Epic Composer", avatar: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80" },
  { id: "art8", name: "Kenshi Yonezu", genre: "J-Pop Maestro", avatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&q=80" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account credentials
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Preferences
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["vocaloid", "anisong"]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(["art1", "art3"]);
  const [availableArtists, setAvailableArtists] = useState(ARTIST_OPTIONS);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setAuth, setPreferences } = useAuthStore();

  useEffect(() => {
    // Fetch live artists from API if available
    api
      .get("/api/v1/artists")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((a: Artist, idx: number) => ({
            id: a.id,
            name: a.name,
            genre: a.bio || "Anime Artist",
            avatar: a.avatarUrl || ARTIST_OPTIONS[idx % ARTIST_OPTIONS.length].avatar,
          }));
          setAvailableArtists(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleGoToStep2 = () => {
    if (!email || !username || !password) {
      setErrorMessage("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có tối thiểu 8 ký tự");
      return;
    }
    setErrorMessage("");
    setStep(2);
  };

  const toggleGenre = (id: string) => {
    if (selectedGenres.includes(id)) {
      if (selectedGenres.length === 1) return; // Keep at least 1
      setSelectedGenres(selectedGenres.filter((g) => g !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const toggleArtist = (id: string) => {
    if (selectedArtists.includes(id)) {
      setSelectedArtists(selectedArtists.filter((a) => a !== id));
    } else {
      setSelectedArtists([...selectedArtists, id]);
    }
  };

  const handleCompleteRegister = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.post("/api/v1/auth/register", {
        email,
        username,
        displayName: displayName || username,
        password,
      });

      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);

        // Save music preferences
        const genreNames = GENRE_OPTIONS.filter((g) => selectedGenres.includes(g.id)).map((g) => g.name);
        setPreferences(genreNames, selectedArtists);

        // Auto follow selected artists
        for (const artId of selectedArtists) {
          api.post(`/api/v1/artists/${artId}/follow`).catch(() => {});
        }

        router.replace("/(tabs)");
        return;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.";
      setErrorMessage(errorMsg);
      setStep(1); // Return to step 1 on registration error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>BƯỚC {step}/2</Text>
          </View>
          <Text style={styles.title}>
            {step === 1 ? "Tạo Tài Khoản Waifu" : "Sở Thích Âm Nhạc ✨"}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? "Gia nhập thế giới âm nhạc Anime & Vocaloid đỉnh cao"
              : "Chọn thể loại và ca sĩ yêu thích để Waifu Player đề xuất bài hát phù hợp nhất với bạn"}
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.dark.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          /* STEP 1: CREDENTIALS */
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="miku@waifuplayer.com"
                placeholderTextColor={Colors.dark.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên đăng nhập *</Text>
              <TextInput
                style={styles.input}
                placeholder="miku_chan"
                placeholderTextColor={Colors.dark.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                placeholder="Hatsune Miku Fan 🌸"
                placeholderTextColor={Colors.dark.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu * (Tối thiểu 8 ký tự)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleGoToStep2} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Tiếp tục: Chọn Sở Thích Âm Nhạc</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>Đã có tài khoản? Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* STEP 2: GENRES & ARTISTS ONBOARDING */
          <View>
            {/* Section 1: Genres */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>1. Thể loại bạn yêu thích 🎧</Text>
              <Text style={styles.sectionHint}>Đã chọn: {selectedGenres.length}</Text>
            </View>

            <View style={styles.genresGrid}>
              {GENRE_OPTIONS.map((genre) => {
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <TouchableOpacity
                    key={genre.id}
                    style={[styles.genreCard, isSelected && styles.genreCardActive]}
                    onPress={() => toggleGenre(genre.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.genreHeader}>
                      <Text style={styles.genreEmoji}>{genre.emoji}</Text>
                      {isSelected && (
                        <View style={styles.selectedCheck}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.genreName, isSelected && styles.genreNameActive]}>
                      {genre.name}
                    </Text>
                    <Text style={styles.genreDesc} numberOfLines={2}>
                      {genre.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Artists */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>2. Nghệ sĩ & Waifu yêu thích ⭐</Text>
              <Text style={styles.sectionHint}>Đã chọn: {selectedArtists.length}</Text>
            </View>

            <View style={styles.artistsGrid}>
              {availableArtists.map((artist) => {
                const isSelected = selectedArtists.includes(artist.id);
                return (
                  <TouchableOpacity
                    key={artist.id}
                    style={[styles.artistCard, isSelected && styles.artistCardActive]}
                    onPress={() => toggleArtist(artist.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.artistAvatarWrapper}>
                      <Image source={{ uri: artist.avatar }} style={styles.artistAvatar} />
                      {isSelected && (
                        <View style={styles.artistCheckBadge}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.artistName, isSelected && { color: Colors.dark.primaryLight }]} numberOfLines={1}>
                      {artist.name}
                    </Text>
                    <Text style={styles.artistGenre} numberOfLines={1}>
                      {artist.genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Complete Register Button */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCompleteRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Hoàn Tất & Khám Phá Âm Nhạc</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={16} color={Colors.dark.textMuted} />
              <Text style={styles.backStepText}>Quay lại chỉnh sửa thông tin</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  stepBadge: {
    backgroundColor: "rgba(233, 30, 140, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 140, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  stepBadgeText: {
    color: Colors.dark.primaryLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: Colors.dark.error,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: Colors.dark.text,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 10,
    padding: 14,
    color: Colors.dark.text,
    fontSize: 15,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  backBtn: {
    padding: 14,
    alignItems: "center",
    marginTop: 6,
  },
  backBtnText: {
    color: Colors.dark.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  backStepBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 6,
    marginTop: 8,
  },
  backStepText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.dark.primaryLight,
    fontWeight: "600",
  },
  genresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genreCard: {
    width: "48%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  genreCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(233, 30, 140, 0.12)",
  },
  genreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  genreEmoji: {
    fontSize: 22,
  },
  selectedCheck: {
    backgroundColor: Colors.dark.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  genreName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  genreNameActive: {
    color: Colors.dark.primaryLight,
  },
  genreDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  artistsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  artistCard: {
    width: "22.5%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  artistCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(233, 30, 140, 0.15)",
  },
  artistAvatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  artistAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.dark.card,
  },
  artistCheckBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.dark.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  artistName: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  artistGenre: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
});
