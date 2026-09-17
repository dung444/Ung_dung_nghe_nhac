export const Colors = {
  dark: {
    background: "#0f0f1a",
    surface: "#1a1a2e",
    card: "#16213e",
    primary: "#e91e8c",
    primaryLight: "#ff4db8",
    secondary: "#a855f7",
    accent: "#06b6d4",
    text: "#f0f0ff",
    textMuted: "#8888aa",
    border: "#2a2a4a",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    playerBg: "#0d0d1f",
  },
} as const;

export type ThemeColors = typeof Colors.dark;
