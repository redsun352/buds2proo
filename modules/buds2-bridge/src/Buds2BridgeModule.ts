import { requireOptionalNativeModule } from "expo";

import type { BluetoothSnapshot, Buds2ControlResult, Buds2NativeModule } from "./types";

const unavailableSnapshot = (): BluetoothSnapshot => ({
  nativeModuleAvailable: false,
  bluetoothSupported: false,
  bluetoothEnabled: false,
  permissionGranted: false,
  devices: [],
  updatedAt: null,
  reason: "native_module_unavailable",
});

const fallbackModule: Buds2NativeModule = {
  getBluetoothSnapshot: async () => unavailableSnapshot(),
  discoverBluetoothDevices: async () => unavailableSnapshot(),
  applyNoiseControl: async () => unavailableControl("noise_control"),
  applyEqualizer: async () => unavailableControl("equalizer"),
  openBluetoothSettings: () => false,
};

function unavailableControl(command: Buds2ControlResult["command"]): Buds2ControlResult {
  return {
    command,
    status: "blocked",
    message: "Bu işlev, Buds2 köprüsünü içeren Android release derlemesinde kullanılabilir.",
  };
}

const Buds2BridgeModule =
  requireOptionalNativeModule<Buds2NativeModule>("Buds2Bridge") ?? fallbackModule;

export default Buds2BridgeModule;
