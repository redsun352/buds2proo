import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";

const TAB_ICONS = {
  index: "headphones",
  devices: "bluetooth-connect",
  preferences: "tune-variant",
  help: "help-circle-outline",
} as const;

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const tabBarHeight = 59 + bottomPadding;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#80D4FF",
        tabBarInactiveTintColor: "#8492A8",
        tabBarButton: HapticTab,
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons
            color={color}
            name={TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? "circle"}
            size={focused ? 24 : 23}
          />
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: "#263246",
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 7,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Durum" }} />
      <Tabs.Screen name="devices" options={{ title: "Cihazlar" }} />
      <Tabs.Screen name="preferences" options={{ title: "Tercihler" }} />
      <Tabs.Screen name="help" options={{ title: "Yardım" }} />
    </Tabs>
  );
}
