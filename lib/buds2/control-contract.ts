import type {
  Buds2EqualizerPreset,
  Buds2NoiseControlMode,
} from "@/modules/buds2-bridge";
import type { AmbientProfile, EqualizerPreset } from "./preferences";

export function noiseModeForAmbientProfile(profile: AmbientProfile): Buds2NoiseControlMode {
  if (profile === "odak") return "anc";
  if (profile === "farkındalık") return "ambient";
  return "off";
}

export function equalizerCommandForPreference(preset: EqualizerPreset): Buds2EqualizerPreset {
  if (preset === "bas") return "bass_boost";
  if (preset === "yumuşak") return "soft";
  if (preset === "dinamik") return "dynamic";
  if (preset === "temiz") return "clear";
  if (preset === "tiz") return "treble_boost";
  return "normal";
}
