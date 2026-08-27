import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function ScreenHeader({ eyebrow, title, description, icon }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {icon ? (
        <View style={styles.iconSurface}>
          <MaterialCommunityIcons color="#80D4FF" name={icon} size={24} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
  },
  description: {
    color: "#AAB5C8",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  eyebrow: {
    color: "#80D4FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  iconSurface: {
    alignItems: "center",
    backgroundColor: "#1C2D3F",
    borderColor: "#294965",
    borderRadius: 18,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  title: {
    color: "#F2F5FA",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 37,
    marginTop: 2,
  },
});
