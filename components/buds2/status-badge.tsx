import { StyleSheet, Text, View } from "react-native";

type BadgeTone = "success" | "warning" | "neutral" | "error";

const TONE_STYLES = {
  success: { backgroundColor: "#153E34", color: "#73E5B3", dot: "#4ED7A0" },
  warning: { backgroundColor: "#4B3519", color: "#FFD18A", dot: "#FFC971" },
  neutral: { backgroundColor: "#283040", color: "#B7C6DE", dot: "#AAB5C8" },
  error: { backgroundColor: "#52262E", color: "#FFB5B9", dot: "#FF8E93" },
} as const;

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const selectedTone = TONE_STYLES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: selectedTone.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: selectedTone.dot }]} />
      <Text style={[styles.label, { color: selectedTone.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    minHeight: 28,
    paddingHorizontal: 11,
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
