import { Platform } from "react-native";

import { Buds2BridgeModule } from "@/modules/buds2-bridge";
import type { BluetoothSnapshot } from "@/modules/buds2-bridge";

export const EMPTY_BLUETOOTH_SNAPSHOT: BluetoothSnapshot = {
  nativeModuleAvailable: Platform.OS === "android",
  bluetoothSupported: false,
  bluetoothEnabled: false,
  permissionGranted: false,
  devices: [],
  updatedAt: null,
};

export async function getBluetoothSnapshot(): Promise<BluetoothSnapshot> {
  try {
    return await Buds2BridgeModule.getBluetoothSnapshot();
  } catch {
    return {
      ...EMPTY_BLUETOOTH_SNAPSHOT,
      nativeModuleAvailable: false,
      reason: "native_call_failed",
    };
  }
}

export function openBluetoothSettings(): boolean {
  try {
    return Buds2BridgeModule.openBluetoothSettings();
  } catch {
    return false;
  }
}
