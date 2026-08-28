import { requireOptionalNativeModule } from "expo";

import type { BluetoothSnapshot, Buds2NativeModule } from "./types";

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
  openBluetoothSettings: () => false,
};

const Buds2BridgeModule =
  requireOptionalNativeModule<Buds2NativeModule>("Buds2Bridge") ?? fallbackModule;

export default Buds2BridgeModule;
