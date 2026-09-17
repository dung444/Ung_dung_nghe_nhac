import { Stack } from "expo-router";
import { Colors } from "../../constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.dark.surface },
        headerTintColor: Colors.dark.text,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Đăng nhập", headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Đăng ký" }} />
    </Stack>
  );
}
