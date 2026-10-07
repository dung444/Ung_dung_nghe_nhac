import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToastStore, type ToastType } from "../../store/toastStore";
import { Colors } from "../../constants/colors";

const TYPE_CONFIG: Record<
  ToastType,
  {
    bg: string;
    border: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    badgeText: string;
  }
> = {
  success: {
    bg: "rgba(16, 185, 129, 0.15)",
    border: "#10b981",
    icon: "checkmark-circle",
    iconColor: "#10b981",
    badgeText: "THÀNH CÔNG",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.18)",
    border: "#ef4444",
    icon: "alert-circle",
    iconColor: "#ef4444",
    badgeText: "LỖI HỆ THỐNG",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.18)",
    border: "#f59e0b",
    icon: "warning",
    iconColor: "#f59e0b",
    badgeText: "CẢNH BÁO",
  },
  info: {
    bg: "rgba(6, 182, 212, 0.15)",
    border: "#06b6d4",
    icon: "information-circle",
    iconColor: "#22d3ee",
    badgeText: "THÔNG BÁO",
  },
};

export function ToastNotification() {
  const { currentToast, hideToast } = useToastStore();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentToast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentToast]);

  if (!currentToast) return null;

  const config = TYPE_CONFIG[currentToast.type] || TYPE_CONFIG.info;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          borderColor: config.border,
          backgroundColor: "#161626",
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.innerBox}
        activeOpacity={0.9}
        onPress={hideToast}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.badgeRow}>
            <View style={[styles.miniBadge, { borderColor: config.border }]}>
              <Text style={[styles.miniBadgeText, { color: config.iconColor }]}>
                {config.badgeText}
              </Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {currentToast.title}
          </Text>
          {!!currentToast.message && (
            <Text style={styles.message} numberOfLines={2}>
              {currentToast.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={hideToast}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={Colors.dark.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999999,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  innerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.6,
  },
  miniBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "700",
    marginTop: 1,
  },
  message: {
    color: Colors.dark.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
});
