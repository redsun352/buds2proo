import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/buds2/screen-header";
import { TactileButton } from "@/components/buds2/tactile-button";
import { ScreenContainer } from "@/components/screen-container";
import { useBuds2Device } from "@/hooks/use-buds2-device";

const HELP_STEPS = [
  { number: "01", title: "Buds2'yi eşle", body: "Kulaklıkları kutudan çıkarın ve Android Bluetooth ayarlarından Galaxy Buds2 olarak eşleyin." },
  { number: "02", title: "Yakındaki cihazlar iznini ver", body: "Uygulama eşlenmiş cihazları ve ses profili bağlantısını yalnızca bu izinle okuyabilir." },
  { number: "03", title: "Bağlantıyı yenile", body: "Buds2 Companion ana ekranından durumu yenileyin. Cihaz A2DP veya HFP profiliyle bağlandığında görünür." },
];

export default function HelpScreen() {
  const { snapshot, permissionState, openBluetoothSettings } = useBuds2Device();

  const handleBluetoothSettings = () => {
    if (!openBluetoothSettings() && Platform.OS === "android") {
      void Linking.openSettings();
    }
  };

  return (
    <ScreenContainer className="px-5">
      <View style={styles.content}>
        <ScreenHeader
          eyebrow="Yardım ve uyumluluk"
          title="Bağlantıyı ayarla"
          description="Buds2 Companion, Android'in genel Bluetooth bilgilerini kullanır ve işlev sınırlarını açıkça gösterir."
          icon="help-circle-outline"
        />

        <View style={styles.compatibilityCard}>
          <View style={styles.compatibilityIcon}>
            <MaterialCommunityIcons color="#80D4FF" name="shield-check-outline" size={25} />
          </View>
          <View style={styles.compatibilityCopy}>
            <Text style={styles.compatibilityTitle}>Uygulama denetimi</Text>
            <Text style={styles.compatibilityBody}>
              {Platform.OS !== "android"
                ? "Bluetooth cihaz köprüsü Android uygulama derlemesinde etkin olur."
                : permissionState !== "granted"
                  ? "Yakındaki cihazlar izni henüz verilmedi."
                  : !snapshot.bluetoothEnabled
                    ? "Bluetooth kapalı görünüyor."
                    : "Gerekli Android Bluetooth erişimi kullanılabilir."}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bağlantı adımları</Text>
        <View style={styles.steps}>
          {HELP_STEPS.map((step) => (
            <View key={step.number} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{step.number}</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <TactileButton label="Android Bluetooth ayarlarını aç" onPress={handleBluetoothSettings} style={styles.settingsButton} />

        <Text style={styles.sectionTitle}>Bu sürüm ne yapar?</Text>
        <View style={styles.capabilityTable}>
          <View style={styles.capabilityRow}>
            <MaterialCommunityIcons color="#4ED7A0" name="check-circle-outline" size={20} />
            <Text style={styles.capabilityText}>Eşlenmiş cihazları ve A2DP/HFP bağlantı durumunu gösterir.</Text>
          </View>
          <View style={styles.capabilityRow}>
            <MaterialCommunityIcons color="#4ED7A0" name="check-circle-outline" size={20} />
            <Text style={styles.capabilityText}>Dinleme tercihlerini yalnızca telefonda saklar.</Text>
          </View>
          <View style={styles.capabilityRow}>
            <MaterialCommunityIcons color="#FFC971" name="alert-circle-outline" size={20} />
            <Text style={styles.capabilityText}>Buds2’nin ANC, ekolayzır veya dokunmatik kontrolünü değiştirmez.</Text>
          </View>
          <View style={styles.capabilityRow}>
            <MaterialCommunityIcons color="#FFC971" name="alert-circle-outline" size={20} />
            <Text style={styles.capabilityText}>Sol, sağ ve kutu pil yüzdeleri Android paylaşmazsa bilinmiyor olarak kalır.</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  capabilityRow: { alignItems: "flex-start", flexDirection: "row", gap: 10, paddingVertical: 11 },
  capabilityTable: { backgroundColor: "#1C2230", borderColor: "#2A3447", borderRadius: 18, borderWidth: 1, marginTop: 10, paddingHorizontal: 15, paddingVertical: 3 },
  capabilityText: { color: "#C6D0DE", flex: 1, fontSize: 13, lineHeight: 19 },
  compatibilityBody: { color: "#BED0E4", fontSize: 12, lineHeight: 18, marginTop: 3 },
  compatibilityCard: { alignItems: "center", backgroundColor: "#17283A", borderColor: "#294C6B", borderRadius: 19, borderWidth: 1, flexDirection: "row", gap: 13, marginTop: 25, padding: 15 },
  compatibilityCopy: { flex: 1 },
  compatibilityIcon: { alignItems: "center", backgroundColor: "#203E58", borderRadius: 14, height: 47, justifyContent: "center", width: 47 },
  compatibilityTitle: { color: "#ECF6FF", fontSize: 14, fontWeight: "800" },
  content: { paddingBottom: 35, paddingTop: 12 },
  sectionTitle: { color: "#F0F5FB", fontSize: 17, fontWeight: "800", marginTop: 27 },
  settingsButton: { marginTop: 22 },
  stepBody: { color: "#9AA8BC", fontSize: 12, lineHeight: 18, marginTop: 4 },
  stepCopy: { flex: 1 },
  stepNumber: { color: "#80D4FF", fontSize: 12, fontWeight: "900", letterSpacing: 0.7, marginTop: 2, width: 24 },
  stepRow: { alignItems: "flex-start", flexDirection: "row", gap: 11, paddingBottom: 16 },
  stepTitle: { color: "#EAF1F8", fontSize: 14, fontWeight: "800" },
  steps: { borderLeftColor: "#31445B", borderLeftWidth: 1, gap: 3, marginLeft: 11, marginTop: 15, paddingLeft: 18 },
});
