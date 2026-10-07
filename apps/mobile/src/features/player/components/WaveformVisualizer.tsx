/**
 * WaveformVisualizer – Animated audio waveform bar visualizer
 * Hiển thị sóng âm động khi nhạc đang phát, dừng lại khi pause.
 * Sử dụng react-native-reanimated với withRepeat + withSequence để tạo hiệu ứng nhịp điệu.
 */
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";

// ---------- Config ----------
const BAR_COUNT = 30;
const BAR_MIN_H = 3;
const BAR_MAX_H = 48;
const BAR_WIDTH = 3;
const BAR_GAP = 2;

// Gradient màu anime: từ tím → hồng → cam
const BAR_COLORS = [
  "#a855f7",
  "#c026d3",
  "#e879f9",
  "#f472b6",
  "#fb923c",
  "#f472b6",
  "#e879f9",
  "#c026d3",
];

function getBarColor(index: number): string {
  return BAR_COLORS[index % BAR_COLORS.length];
}

function randomDuration(index: number): number {
  const seeds = [420, 380, 560, 330, 490, 610, 280, 520, 370, 440];
  return seeds[index % seeds.length] + (index % 7) * 30;
}

function randomHeight(index: number): number {
  const heights = [
    0.85, 0.45, 0.95, 0.3, 0.75, 0.6, 0.9, 0.4, 0.7, 0.55,
    0.8, 0.35, 1.0, 0.5, 0.65, 0.88, 0.42, 0.78, 0.58, 0.92,
    0.48, 0.82, 0.38, 0.68, 0.9, 0.52, 0.72, 0.44, 0.86, 0.62,
  ];
  return BAR_MIN_H + (heights[index % heights.length] ?? 0.5) * (BAR_MAX_H - BAR_MIN_H);
}

// ---------- Single Animated Bar ----------
interface BarProps {
  index: number;
  isPlaying: boolean;
}

function AnimatedBar({ index, isPlaying }: BarProps) {
  const height = useSharedValue(BAR_MIN_H);
  const targetH = randomHeight(index);
  const dur = randomDuration(index);

  useEffect(() => {
    if (isPlaying) {
      const offset = (index * 47) % 200;
      const timeoutId = setTimeout(() => {
        height.value = withRepeat(
          withSequence(
            withTiming(targetH, { duration: dur, easing: Easing.inOut(Easing.sin) }),
            withTiming(BAR_MIN_H + (targetH - BAR_MIN_H) * 0.15, {
              duration: dur * 0.7,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(targetH * 0.6, { duration: dur * 0.5, easing: Easing.inOut(Easing.sin) }),
            withTiming(BAR_MIN_H, { duration: dur * 0.6, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );
      }, offset);
      return () => clearTimeout(timeoutId);
    } else {
      cancelAnimation(height);
      height.value = withTiming(BAR_MIN_H + 2, { duration: 300, easing: Easing.out(Easing.quad) });
    }
  }, [isPlaying]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    borderRadius: height.value / 2,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: BAR_WIDTH, backgroundColor: getBarColor(index) },
        animStyle,
      ]}
    />
  );
}

// ---------- Main Waveform Component ----------
export interface WaveformVisualizerProps {
  isPlaying: boolean;
  progress?: number;
  style?: object;
}

export function WaveformVisualizer({ isPlaying, progress = 0, style }: WaveformVisualizerProps) {
  const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP);

  return (
    <View style={[styles.container, { width: totalWidth }, style]}>
      {/* Progress tint overlay */}
      <View
        style={[
          styles.progressOverlay,
          { width: `${Math.min(100, progress * 100)}%` as any },
        ]}
        pointerEvents="none"
      />

      {/* Bars */}
      <View style={styles.barsRow}>
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <AnimatedBar key={i} index={i} isPlaying={isPlaying} />
        ))}
      </View>

      {/* Glow reflection */}
      {isPlaying && (
        <View style={styles.reflection} pointerEvents="none">
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.reflectionBar,
                { width: BAR_WIDTH, backgroundColor: getBarColor(i) },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "flex-end",
    height: BAR_MAX_H + 16,
    position: "relative",
    overflow: "hidden",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: BAR_GAP,
    height: BAR_MAX_H,
  },
  bar: {
    width: BAR_WIDTH,
    minHeight: BAR_MIN_H,
  },
  progressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    borderRadius: 8,
  },
  reflection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: BAR_GAP,
    height: 8,
    opacity: 0.25,
    marginTop: 2,
    transform: [{ scaleY: -0.3 }],
  },
  reflectionBar: {
    width: BAR_WIDTH,
    height: 8,
    borderRadius: 2,
  },
});
