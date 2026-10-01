import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Colors } from "../../../constants/colors";
import { formatDuration } from "@waifu-player/utils";

interface ProgressBarProps {
  position?: number;
  duration?: number;
  onSeek?: (value: number) => void;
}

export function ProgressBar({ position = 0, duration = 180, onSeek }: ProgressBarProps) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(position);

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(position);
    }
  }, [position, isSeeking]);

  const displayPos = isSeeking ? seekValue : position;
  const safeDuration = Math.max(duration, 1);

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        value={displayPos}
        minimumValue={0}
        maximumValue={safeDuration}
        onValueChange={(val) => {
          setIsSeeking(true);
          setSeekValue(val);
        }}
        onSlidingComplete={(val) => {
          setIsSeeking(false);
          onSeek?.(val);
        }}
        minimumTrackTintColor={Colors.dark.primary}
        maximumTrackTintColor={Colors.dark.border}
        thumbTintColor={Colors.dark.primaryLight}
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatDuration(displayPos)}</Text>
        <Text style={styles.timeText}>{formatDuration(safeDuration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 4 },
  slider: { width: "100%", height: 36 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: -4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
});
