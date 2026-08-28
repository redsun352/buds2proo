import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";

import { useBuds2Device } from "@/hooks/use-buds2-device";
import { applyEqualizer, applyNoiseControl } from "@/lib/buds2/device-service";
import { findLikelyBuds2 } from "@/lib/buds2/device-state";
import type {
  Buds2ControlResult,
  Buds2EqualizerPreset,
  Buds2NoiseControlMode,
} from "@/modules/buds2-bridge";

function unavailableResult(command: Buds2ControlResult["command"]): Buds2ControlResult {
  return {
    command,
    status: "blocked",
    message: "Önce Galaxy Buds2'yi bağlayın, ardından cihazlar ekranından durumu yenileyin.",
  };
}

export function useBuds2Control() {
  const { snapshot, permissionState, refresh } = useBuds2Device();
  const [isApplying, setIsApplying] = useState(false);
  const device = useMemo(() => findLikelyBuds2(snapshot.devices), [snapshot.devices]);
  const hasConnectedBuds2 = Boolean(device && (device.a2dpConnected || device.headsetConnected));
  const isAvailable =
    Platform.OS === "android" &&
    snapshot.nativeModuleAvailable &&
    snapshot.bluetoothEnabled &&
    permissionState === "granted" &&
    hasConnectedBuds2;

  const run = useCallback(
    async (
      command: Buds2ControlResult["command"],
      operation: () => Promise<Buds2ControlResult>,
    ) => {
      if (!isAvailable || !device) return unavailableResult(command);
      setIsApplying(true);
      try {
        return await operation();
      } finally {
        setIsApplying(false);
        void refresh();
      }
    },
    [device, isAvailable, refresh],
  );

  const setNoiseControl = useCallback(
    (mode: Buds2NoiseControlMode) =>
      run("noise_control", () => applyNoiseControl(device?.id ?? "", mode)),
    [device?.id, run],
  );

  const setEqualizer = useCallback(
    (preset: Buds2EqualizerPreset) =>
      run("equalizer", () => applyEqualizer(device?.id ?? "", preset)),
    [device?.id, run],
  );

  return {
    device,
    isApplying,
    isAvailable,
    refresh,
    setEqualizer,
    setNoiseControl,
  };
}
