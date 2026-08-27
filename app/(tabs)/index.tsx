import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/buds2/screen-header";
import { StatusBadge } from "@/components/buds2/status-badge";
import { TactileButton } from "@/components/buds2/tactile-button";
import { useBuds2Device } from "@/hooks/use-buds2-device";
import { deriveDeviceUiState, findLikelyBuds2 } from "@/lib/buds2/device-state";
import type { BluetoothAudioDevice } from "@/modules/buds2-bridge";

function ConnectionCard({
  device,
  statusLabel,
  statusTone,
}: {
  device?: BluetoothAudioDevice;
  statusLabel: string;
  statusTone: "success" | "warning" | "neutral" | "error";
}) {
  const connectionText = device
    ? device.a2dpConnected || device.headsetConnected
      ? "Ses profili etkin"
      : "Eşlenmiş, bağlı değil"
    : "Yakındaki cihazlar izni sonrası algılanır";

  return (
    <View style={styles.connectionCard}>
      <View style={styles.earbudVisual}>
        <View style={styles.earbudLeft} />
        <View style={styles.earbudRight} />
        <View style={styles.earbudStemLeft} />
        <View style={styles.earbudStemRight} />
      </View>
      <View style={styles.connectionCopy}>
        <StatusBadge label={statusLabel} tone={statusTone} />
        <Text numberOfLines={1} style={styles.deviceName}>
          {device?.name ?? "Galaxy Buds2"}
        </Text>
        <Text style={styles.connectionDetail}>{connectionText}</Text>
      </View>
    </View>
  );
}

function BatteryTile({ label, detail, icon }: { label: string; detail: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.batteryTile}>
      <View style={styles.batteryIcon}>
        <MaterialCommunityIcons color="#80D4FF" name={icon} size={20} />
      </View>
      <Text style={styles.batteryLabel}>{label}</Text>
      <Text style={styles.batteryValue}>Bilinmiyor</Text>
      <Text style={styles.batteryDetail}>{detail}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [notice, setNotice] = useState<string | null>(null);
  const {
    snapshot,
    permissionState,
    isRefreshing,
    refresh,
    requestBluetoothPermission,
    openBluetoothSettings,
  } = useBuds2Device();

  const budsDevice = useMemo(() => findLikelyBuds2(snapshot.devices), [snapshot.devices]);

  const state = useMemo(
    () =>
      deriveDeviceUiState({
        platform: Platform.OS,
        snapshot,
        permissionState,
        budsDevice,
      }),
    [budsDevice, permissionState, snapshot],
  );

  const handlePrimaryAction = () => {
    if (Platform.OS === "android" && permissionState !== "granted") {
      void requestBluetoothPermission();
      return;
    }
    void refresh();
  };

  const handleBluetoothSettings = () => {
    const opened = openBluetoothSettings();
    if (!opened) {
      setNotice("Bluetooth ayarları yalnızca özel Android derlemesinde açılabilir.");
    }
  };

  const primaryLabel =
    Platform.OS === "android" && permissionState !== "granted"
      ? "Bluetooth erişimine izin ver"
      : "Durumu yenile";

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Buds2 Companion"
          title="Kulaklık durumun"
          description="Bağlantıyı kontrol et, uygun cihazı bul ve dinleme tercihlerini tek yerden yönet."
          icon="headphones"
        />

        <ConnectionCard device={budsDevice} statusLabel={state.label} statusTone={state.tone} />
        <Text style={styles.statusMessage}>{state.message}</Text>

        {notice ? (
          <View style={styles.notice}>
            <MaterialCommunityIcons color="#FFD18A" name="information-outline" size={19} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TactileButton
            disabled={isRefreshing}
            label={isRefreshing ? "Yenileniyor" : primaryLabel}
            onPress={handlePrimaryAction}
            style={styles.primaryAction}
          />
          <TactileButton
            label="Bluetooth ayarları"
            onPress={handleBluetoothSettings}
            style={styles.secondaryAction}
            variant="secondary"
          />
        </View>

        {isRefreshing ? <ActivityIndicator color="#80D4FF" style={styles.loader} /> : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Pil durumu</Text>
            <Text style={styles.sectionSubtitle}>Android tarafından iletilen veriler</Text>
          </View>
          <MaterialCommunityIcons color="#5D6A80" name="shield-check-outline" size={21} />
        </View>

        <View style={styles.batteryGrid}>
          <BatteryTile detail="Sol kulaklık" icon="ear-hearing" label="Sol" />
          <BatteryTile detail="Sağ kulaklık" icon="ear-hearing" label="Sağ" />
          <BatteryTile detail="Şarj kutusu" icon="battery-charging-medium" label="Kutu" />
        </View>

        <View style={styles.disclosureCard}>
          <MaterialCommunityIcons color="#AAB5C8" name="information-outline" size={20} />
          <Text style={styles.disclosureText}>
            Ayrı sol, sağ ve kutu pil seviyeleri Android’in standart Bluetooth API’sinde her zaman paylaşılmaz. Uygulama doğrulanamayan yüzde değerleri göstermez.
          </Text>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Hızlı erişim</Text>
          <View style={styles.quickGrid}>
            <TactileButton
              label="Cihazları gör"
              onPress={() => router.push("/devices")}
              style={styles.quickButton}
              variant="secondary"
            />
            <TactileButton
              label="Tercihleri aç"
              onPress={() => router.push("/preferences")}
              style={styles.quickButton}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  batteryDetail: { color: "#8C9AB0", fontSize: 11, lineHeight: 16, marginTop: 3 },
  batteryGrid: { flexDirection: "row", gap: 10, marginTop: 12 },
  batteryIcon: { alignItems: "center", backgroundColor: "#23354A", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  batteryLabel: { color: "#C8D4E7", fontSize: 12, fontWeight: "700", marginTop: 12 },
  batteryTile: { backgroundColor: "#1C2230", borderColor: "#2A3447", borderRadius: 18, borderWidth: 1, flex: 1, minHeight: 142, padding: 13 },
  batteryValue: { color: "#F2F5FA", fontSize: 16, fontWeight: "800", lineHeight: 22, marginTop: 3 },
  connectionCard: { alignItems: "center", backgroundColor: "#1A293A", borderColor: "#2C5371", borderRadius: 25, borderWidth: 1, flexDirection: "row", gap: 16, marginTop: 24, overflow: "hidden", padding: 20 },
  connectionCopy: { flex: 1 },
  connectionDetail: { color: "#AAB5C8", fontSize: 13, lineHeight: 19, marginTop: 5 },
  content: { gap: 0, paddingBottom: 42, paddingTop: 12 },
  deviceName: { color: "#F5F8FC", fontSize: 21, fontWeight: "800", letterSpacing: -0.3, marginTop: 13 },
  disclosureCard: { alignItems: "flex-start", backgroundColor: "#182130", borderColor: "#2A3547", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 12, padding: 14 },
  disclosureText: { color: "#AAB5C8", flex: 1, fontSize: 12, lineHeight: 18 },
  earbudLeft: { backgroundColor: "#DDEEFF", borderRadius: 14, height: 26, left: 9, position: "absolute", top: 13, transform: [{ rotate: "-24deg" }], width: 21 },
  earbudRight: { backgroundColor: "#DDEEFF", borderRadius: 14, height: 26, right: 9, position: "absolute", top: 13, transform: [{ rotate: "24deg" }], width: 21 },
  earbudStemLeft: { backgroundColor: "#BFDFFF", borderBottomLeftRadius: 7, borderBottomRightRadius: 7, height: 22, left: 15, position: "absolute", top: 32, transform: [{ rotate: "-14deg" }], width: 8 },
  earbudStemRight: { backgroundColor: "#BFDFFF", borderBottomLeftRadius: 7, borderBottomRightRadius: 7, height: 22, position: "absolute", right: 15, top: 32, transform: [{ rotate: "14deg" }], width: 8 },
  earbudVisual: { backgroundColor: "#2C5371", borderRadius: 23, height: 72, overflow: "hidden", width: 72 },
  loader: { marginTop: 10 },
  notice: { alignItems: "flex-start", backgroundColor: "#3B2D1B", borderColor: "#6B4B23", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 12, padding: 12 },
  noticeText: { color: "#FFD18A", flex: 1, fontSize: 12, lineHeight: 18 },
  primaryAction: { flex: 1.2 },
  quickButton: { flex: 1 },
  quickGrid: { flexDirection: "row", gap: 10, marginTop: 12 },
  quickSection: { marginTop: 26 },
  secondaryAction: { flex: 1 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  sectionSubtitle: { color: "#7F8DA4", fontSize: 12, marginTop: 3 },
  sectionTitle: { color: "#EDF3FA", fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  statusMessage: { color: "#AAB5C8", fontSize: 13, lineHeight: 20, marginHorizontal: 4, marginTop: 11 },
});
