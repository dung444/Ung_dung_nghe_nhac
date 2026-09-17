import React from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { getInitials } from "@waifu-player/utils";

interface AvatarProps { uri?: string | null; name: string; size?: number; }

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: "#fff", fontSize: size * 0.35, fontWeight: "700" }}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: Colors.dark.primary, alignItems: "center", justifyContent: "center" },
});
