import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { View, Platform } from "react-native";
import { MiniPlayer } from "../../features/player/components/MiniPlayer";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.dark.surface,
            borderTopColor: "rgba(255, 255, 255, 0.08)",
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 84 : 64,
            paddingBottom: Platform.OS === "ios" ? 24 : 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.dark.primaryLight,
          tabBarInactiveTintColor: Colors.dark.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Trang chủ",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Khám phá",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Thư viện",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "library" : "library-outline"} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Waifu Hub",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={22} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Global Floating Mini Player above tabs */}
      <View
        style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? 86 : 66,
          left: 0,
          right: 0,
          zIndex: 999,
        }}
        pointerEvents="box-none"
      >
        <MiniPlayer onPress={() => router.push("/song/current")} />
      </View>
    </View>
  );
}
