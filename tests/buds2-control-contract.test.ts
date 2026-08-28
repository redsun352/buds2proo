import { describe, expect, it } from "vitest";

import {
  equalizerCommandForPreference,
  noiseModeForAmbientProfile,
} from "../lib/buds2/control-contract";

describe("Buds2 kontrol sözleşmesi", () => {
  it("ortam profillerini birbirini dışlayan Buds2 ses modlarına eşler", () => {
    expect(noiseModeForAmbientProfile("odak")).toBe("anc");
    expect(noiseModeForAmbientProfile("farkındalık")).toBe("ambient");
    expect(noiseModeForAmbientProfile("dengeli")).toBe("off");
  });

  it("uygulama ekolayzır seçeneklerini desteklenen RFCOMM ön ayarlarına eşler", () => {
    expect(equalizerCommandForPreference("normal")).toBe("normal");
    expect(equalizerCommandForPreference("bas")).toBe("bass_boost");
    expect(equalizerCommandForPreference("yumuşak")).toBe("soft");
    expect(equalizerCommandForPreference("dinamik")).toBe("dynamic");
    expect(equalizerCommandForPreference("temiz")).toBe("clear");
    expect(equalizerCommandForPreference("tiz")).toBe("treble_boost");
  });
});
