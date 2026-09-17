import React from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Colors } from "../../../constants/colors";

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (value: number) => void;
}

export function ProgressBar({ position, duration, onSeek }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        value={position}
        minimumValue={0}
        maximumValue={duration || 1}
        onSlidingComplete={onSeek}
        minimumTrackTintColor={Colors.dark.primary}
        maximumTrackTintColor={Colors.dark.border}
        thumbTintColor={Colors.dark.primaryLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 4 },
  slider: { width: "100%", height: 40 },
});
