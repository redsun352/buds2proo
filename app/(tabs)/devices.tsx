import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/buds2/screen-header";
import { StatusBadge } from "@/components/buds2/status-badge";
import { TactileButton } from "@/components/buds2/tactile-button";
import { ScreenContainer } from "@/components/screen-container";
import { useBuds2Device } from "@/hooks/use-buds2-device";
import type { BluetoothAudioDevice } from "@/modules/buds2-bridge";

function DeviceCard({ device }: { device: BluetoothAudioDevice }) {
  const isConnected = device.a2dpConnected || device.headsetConnected;
  const connectionLabel = isConnected ? "Bağlı" : "Eşlenmiş";

  return (
    <View style={[styles.deviceCard, device.isLikelyBuds2 && styles.budsCard]}>
      <View style={[styles.deviceIcon, device.isLikelyBuds2 && styles.budsIcon]}>
        <MaterialCommunityIcons
          color={device.isLikelyBuds2 ? "#80D4FF" : "#B7C6DE"}
          name={device.isLikelyBuds2 ? "headphones" : "bluetooth"}
          size={24}
        />
      </View>
      <View style={styles.deviceCopy}>
        <Text numberOfLines={1} style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceMeta}>{device.isLikelyBuds2 ? "Galaxy Buds2 ad eşleşmesi" : `Bluetooth • ${device.deviceType}`}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={connectionLabel} tone={isConnected ? "success" : "neutral"} />
          {device.a2dpConnected ? <Text style={styles.profileText}>A2DP</Text> : null}
          {device.headsetConnected ? <Text style={styles.profileText}>HFP</Text> : null}
        </View>
      </View>
    </View>
  );
}

export default function DevicesScreen() {
  const [notice, setNotice] = useState<string | null>(null);
  const {
    snapshot,
    permissionState,
    isRefreshing,
    refresh,
    requestBluetoothPermission,
    openBluetoothSettings,
  } = useBuds2Device();

  const handleBluetoothSettings = () => {
    if (!openBluetoothSettings()) {
      setNotice("Bluetooth ayarlarına yönlendirme, özel Android derlemesinde kullanılabilir.");
    }
  };

  const renderDevice = ({ item }: { item: BluetoothAudioDevice }) => <DeviceCard device={item} />;
  const isAndroid = Platform.OS === "android";
  const requiresPermission = isAndroid && permissionState !== "granted";

  return (
    <ScreenContainer className="px-5">
      <View style={styles.headerArea}>
        <ScreenHeader
          eyebrow="Cihazlar"
          title="Bluetooth cihazların"
          description="Android'de eşlenmiş ses cihazları güvenli bağlantı kontrolleriyle listelenir."
          icon="bluetooth-connect"
        />
      </View>

      {requiresPermission ? (
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons color="#FFD18A" name="shield-key-outline" size={24} />
          <View style={styles.permissionCopy}>
            <Text style={styles.permissionTitle}>Yakındaki cihazlar izni gerekli</Text>
            <Text style={styles.permissionBody}>Uygulama yalnızca eşlenmiş cihaz adlarını ve bağlantı profillerini okur.</Text>
          </View>
          <TactileButton label="İzin ver" onPress={() => void requestBluetoothPermission()} variant="secondary" />
        </View>
      ) : null}

      {!snapshot.bluetoothEnabled && permissionState === "granted" ? (
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons color="#FFD18A" name="bluetooth-off" size={24} />
          <View style={styles.permissionCopy}>
            <Text style={styles.permissionTitle}>Bluetooth kapalı</Text>
            <Text style={styles.permissionBody}>Eşlenmiş cihazların güncel durumunu görüntülemek için Bluetooth’u açın.</Text>
          </View>
          <TactileButton label="Ayarlar" onPress={handleBluetoothSettings} variant="secondary" />
        </View>
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.listTitle}>Eşlenmiş cihazlar</Text>
          <Text style={styles.listSubtitle}>{snapshot.devices.length} cihaz bulundu</Text>
        </View>
        <TactileButton
          disabled={isRefreshing}
          label={isRefreshing ? "Yenileniyor" : "Yenile"}
          onPress={() => void refresh()}
          variant="ghost"
        />
      </View>

      <FlatList
        contentContainerStyle={snapshot.devices.length === 0 ? styles.emptyList : styles.listContent}
        data={snapshot.devices}
        keyExtractor={(item) => item.id || item.name}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isRefreshing ? <ActivityIndicator color="#80D4FF" /> : <MaterialCommunityIcons color="#617086" name="headphones-off" size={34} />}
            <Text style={styles.emptyTitle}>{isRefreshing ? "Cihazlar güncelleniyor" : "Henüz cihaz yok"}</Text>
            <Text style={styles.emptyBody}>
              {isAndroid && !snapshot.nativeModuleAvailable
                ? "Bu görünüm, Bluetooth köprüsünü içeren özel Android derlemesinde cihazları listeler."
                : "Galaxy Buds2’yi Android Bluetooth ayarlarından eşleyin ve ardından bu ekranı yenileyin."}
            </Text>
          </View>
        }
        renderItem={renderDevice}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badgeRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  budsCard: { borderColor: "#2A597A" },
  budsIcon: { backgroundColor: "#1B3144" },
  deviceCard: { alignItems: "center", backgroundColor: "#1C2230", borderColor: "#2A3447", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 13, padding: 15 },
  deviceCopy: { flex: 1 },
  deviceIcon: { alignItems: "center", backgroundColor: "#283040", borderRadius: 14, height: 52, justifyContent: "center", width: 52 },
  deviceMeta: { color: "#97A5BA", fontSize: 12, lineHeight: 17, marginTop: 3 },
  deviceName: { color: "#F2F5FA", fontSize: 16, fontWeight: "800" },
  emptyBody: { color: "#9AA8BC", fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 280, textAlign: "center" },
  emptyList: { flexGrow: 1 },
  emptyState: { alignItems: "center", backgroundColor: "#182130", borderColor: "#2A3547", borderRadius: 20, borderStyle: "dashed", borderWidth: 1, marginTop: 26, paddingHorizontal: 24, paddingVertical: 32 },
  emptyTitle: { color: "#EAF1F8", fontSize: 16, fontWeight: "800", marginTop: 12 },
  headerArea: { marginTop: 12 },
  listContent: { gap: 10, paddingBottom: 24 },
  listHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 13, marginTop: 23 },
  listSubtitle: { color: "#8290A6", fontSize: 12, marginTop: 3 },
  listTitle: { color: "#EDF3FA", fontSize: 17, fontWeight: "800" },
  notice: { color: "#FFD18A", fontSize: 12, lineHeight: 18, marginTop: 11 },
  permissionBody: { color: "#D4CDBF", fontSize: 12, lineHeight: 17, marginTop: 3 },
  permissionCard: { alignItems: "center", backgroundColor: "#3C3020", borderColor: "#6A512E", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 22, padding: 13 },
  permissionCopy: { flex: 1 },
  permissionTitle: { color: "#FFF0CE", fontSize: 13, fontWeight: "800" },
  profileText: { color: "#AAB5C8", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
});
