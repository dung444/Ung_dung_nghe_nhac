import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from "../../constants/colors";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, style, textStyle }: ButtonProps) {
  const c = Colors.dark;
  const bg: Record<Variant, string> = {
    primary: c.primary, secondary: c.secondary, ghost: "transparent", destructive: c.error,
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, { backgroundColor: bg[variant], opacity: disabled ? 0.5 : 1 }, style]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.label, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
