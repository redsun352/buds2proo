import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface TactileButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof View>["accessibilityRole"] extends never ? never : never;
  style?: StyleProp<ViewStyle>;
}

export function TactileButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: TactileButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        VARIANT_STYLES[variant],
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, LABEL_STYLES[variant]]}>{label}</Text>
    </Pressable>
  );
}

const VARIANT_STYLES = StyleSheet.create({
  primary: { backgroundColor: "#80D4FF" },
  secondary: { backgroundColor: "#273348", borderColor: "#3B4A61", borderWidth: 1 },
  ghost: { backgroundColor: "transparent" },
});

const LABEL_STYLES = StyleSheet.create({
  primary: { color: "#102030" },
  secondary: { color: "#E7F1FF" },
  ghost: { color: "#80D4FF" },
});

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 15,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
