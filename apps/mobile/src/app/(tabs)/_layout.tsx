import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { View } from "react-native";
import { MiniPlayer } from "../../features/player/components/MiniPlayer";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.dark.surface,
            borderTopColor: Colors.dark.border,
          },
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: Colors.dark.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Trang chủ",
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Tìm kiếm",
            tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Thư viện",
            tabBarIcon: ({ color }) => <Ionicons name="library" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Cá nhân",
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>
      
      {/* Global Mini Player over tabs */}
      <View style={{ position: "absolute", bottom: 49, left: 0, right: 0 }}>
        <MiniPlayer onPress={() => router.push("/song/current")} />
      </View>
    </View>
  );
}
