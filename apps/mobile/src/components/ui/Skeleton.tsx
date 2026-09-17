import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

export function Skeleton({ width, height, style }: { width: number | string; height: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.skeleton, { width: width as any, height, opacity }, style]} />;
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: Colors.dark.border, borderRadius: 8 },
});
