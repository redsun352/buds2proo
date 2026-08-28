import AsyncStorage from "@react-native-async-storage/async-storage";

export type AmbientProfile = "odak" | "dengeli" | "farkındalık";
export type EqualizerPreset = "normal" | "bas" | "yumuşak" | "dinamik" | "temiz" | "tiz";

export interface ListeningPreferences {
  ambientProfile: AmbientProfile;
  equalizerPreset: EqualizerPreset;
  touchReminderEnabled: boolean;
  updatedAt: number;
}

const STORAGE_KEY = "buds2-companion:listening-preferences";

export const DEFAULT_LISTENING_PREFERENCES: ListeningPreferences = {
  ambientProfile: "dengeli",
  equalizerPreset: "normal",
  touchReminderEnabled: true,
  updatedAt: 0,
};

export async function loadListeningPreferences(): Promise<ListeningPreferences> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) return DEFAULT_LISTENING_PREFERENCES;

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<ListeningPreferences>;
    const storedPreset = (parsedValue as { equalizerPreset?: EqualizerPreset | "dengeli" }).equalizerPreset;
    const migratedPreset: EqualizerPreset = storedPreset === "dengeli" ? "normal" : storedPreset ?? DEFAULT_LISTENING_PREFERENCES.equalizerPreset;
    return {
      ...DEFAULT_LISTENING_PREFERENCES,
      ...parsedValue,
      equalizerPreset: migratedPreset,
    };
  } catch {
    return DEFAULT_LISTENING_PREFERENCES;
  }
}

export async function saveListeningPreferences(
  preferences: Omit<ListeningPreferences, "updatedAt">,
): Promise<ListeningPreferences> {
  const value: ListeningPreferences = {
    ...preferences,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  return value;
}
