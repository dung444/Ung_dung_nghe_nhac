import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.dark.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
});
