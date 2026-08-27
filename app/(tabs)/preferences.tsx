import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenHeader } from "@/components/buds2/screen-header";
import { ScreenContainer } from "@/components/screen-container";
import { useListeningPreferences } from "@/hooks/use-listening-preferences";
import type { AmbientProfile, EqualizerPreset } from "@/lib/buds2/preferences";

const AMBIENT_OPTIONS: { key: AmbientProfile; title: string; description: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: "odak", title: "Odak", description: "Dış dünyayı en aza indirgemeyi hedefleyen tercih", icon: "headphones" },
  { key: "dengeli", title: "Dengeli", description: "Günlük dinleme için nötr varsayılan", icon: "scale-balance" },
  { key: "farkındalık", title: "Farkındalık", description: "Çevrede olup bitene daha açık kalma notu", icon: "ear-hearing" },
];

const EQUALIZER_OPTIONS: { key: EqualizerPreset; title: string; description: string }[] = [
  { key: "dengeli", title: "Dengeli", description: "Nötr dinleme" },
  { key: "bas", title: "Bas", description: "Alt frekans odağı" },
  { key: "yumuşak", title: "Yumuşak", description: "Uzun dinleme odağı" },
  { key: "dinamik", title: "Dinamik", description: "Belirgin ayrıntı" },
];

export default function PreferencesScreen() {
  const { preferences, isReady, updatePreferences } = useListeningPreferences();
  const [isSaving, setIsSaving] = useState(false);

  const save = async (nextValues: Omit<typeof preferences, "updatedAt">) => {
    setIsSaving(true);
    try {
      await updatePreferences(nextValues);
    } finally {
      setIsSaving(false);
    }
  };

  const selectAmbientProfile = (ambientProfile: AmbientProfile) => {
    void save({ ...preferences, ambientProfile });
  };

  const selectEqualizer = (equalizerPreset: EqualizerPreset) => {
    void save({ ...preferences, equalizerPreset });
  };

  const toggleReminder = (touchReminderEnabled: boolean) => {
    void save({ ...preferences, touchReminderEnabled });
  };

  return (
    <ScreenContainer className="px-5">
      <View style={styles.headerArea}>
        <ScreenHeader
          eyebrow="Yerel tercihler"
          title="Dinleme alanın"
          description="Bu seçimler telefonunda saklanır. Buds2'ye doğrudan komut göndermez."
          icon="tune-variant"
        />
      </View>

      {!isReady ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#80D4FF" />
          <Text style={styles.loadingText}>Tercihler yükleniyor</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>ORTAM PROFİLİ</Text>
          <View style={styles.optionGroup}>
            {AMBIENT_OPTIONS.map((option) => {
              const isSelected = preferences.ambientProfile === option.key;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  key={option.key}
                  onPress={() => selectAmbientProfile(option.key)}
                  style={({ pressed }) => [styles.profileOption, isSelected && styles.profileOptionSelected, pressed && styles.pressed]}
                >
                  <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                    <MaterialCommunityIcons color={isSelected ? "#80D4FF" : "#AAB5C8"} name={option.icon} size={21} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>{isSelected ? <View style={styles.radioDot} /> : null}</View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>EKOLAYZIR NOTU</Text>
          <View style={styles.equalizerGrid}>
            {EQUALIZER_OPTIONS.map((option) => {
              const isSelected = preferences.equalizerPreset === option.key;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  key={option.key}
                  onPress={() => selectEqualizer(option.key)}
                  style={({ pressed }) => [styles.equalizerOption, isSelected && styles.equalizerSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.equalizerTitle, isSelected && styles.equalizerTitleSelected]}>{option.title}</Text>
                  <Text style={styles.equalizerDescription}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Dokunmatik kontrol notu</Text>
              <Text style={styles.switchDescription}>Kulaklık hareketlerinin Buds2 üzerinde ayarlandığını hatırlat.</Text>
            </View>
            <Switch
              onValueChange={toggleReminder}
              thumbColor={preferences.touchReminderEnabled ? "#E8F6FF" : "#B7C3D5"}
              trackColor={{ false: "#3A4558", true: "#337394" }}
              value={preferences.touchReminderEnabled}
            />
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons color="#80D4FF" name="lock-outline" size={20} />
            <Text style={styles.infoCopy}>
              Tercihler yalnızca bu telefonda tutulur. ANC, ekolayzır ve dokunmatik işlevler Buds2’nin üreticiye özgü bağlantı protokolü gerektirdiği için burada değiştirilmiyor.
            </Text>
          </View>

          {isSaving ? <Text style={styles.saveText}>Telefonuna kaydediliyor…</Text> : <Text style={styles.saveText}>Yerel olarak kaydedilir</Text>}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 26, paddingTop: 26 },
  equalizerDescription: { color: "#93A2B7", fontSize: 11, lineHeight: 15, marginTop: 4 },
  equalizerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  equalizerOption: { backgroundColor: "#1C2230", borderColor: "#2A3447", borderRadius: 16, borderWidth: 1, minHeight: 83, padding: 13, width: "48.5%" },
  equalizerSelected: { backgroundColor: "#1B3144", borderColor: "#3B78A2" },
  equalizerTitle: { color: "#DDE6F1", fontSize: 14, fontWeight: "800" },
  equalizerTitleSelected: { color: "#80D4FF" },
  headerArea: { marginTop: 12 },
  infoCard: { alignItems: "flex-start", backgroundColor: "#17283A", borderColor: "#294C6B", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 20, padding: 15 },
  infoCopy: { color: "#BED0E4", flex: 1, fontSize: 12, lineHeight: 19 },
  loadingState: { alignItems: "center", marginTop: 60 },
  loadingText: { color: "#AAB5C8", fontSize: 13, marginTop: 10 },
  optionCopy: { flex: 1 },
  optionDescription: { color: "#9EADBF", fontSize: 12, lineHeight: 17, marginTop: 3 },
  optionGroup: { gap: 9, marginTop: 10 },
  optionIcon: { alignItems: "center", backgroundColor: "#283040", borderRadius: 13, height: 43, justifyContent: "center", width: 43 },
  optionIconSelected: { backgroundColor: "#254966" },
  optionTitle: { color: "#EAF1F8", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  profileOption: { alignItems: "center", backgroundColor: "#1C2230", borderColor: "#2A3447", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 74, padding: 14 },
  profileOptionSelected: { backgroundColor: "#1A2E40", borderColor: "#3B78A2" },
  radio: { alignItems: "center", borderColor: "#65748A", borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: "center", width: 20 },
  radioDot: { backgroundColor: "#80D4FF", borderRadius: 5, height: 10, width: 10 },
  radioSelected: { borderColor: "#80D4FF" },
  saveText: { color: "#8190A7", fontSize: 12, marginTop: 13, textAlign: "center" },
  sectionLabel: { color: "#80D4FF", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 22 },
  switchCopy: { flex: 1, paddingRight: 14 },
  switchDescription: { color: "#98A6B9", fontSize: 12, lineHeight: 18, marginTop: 3 },
  switchRow: { alignItems: "center", backgroundColor: "#1C2230", borderColor: "#2A3447", borderRadius: 18, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 20, padding: 15 },
  switchTitle: { color: "#EAF1F8", fontSize: 14, fontWeight: "800" },
});
