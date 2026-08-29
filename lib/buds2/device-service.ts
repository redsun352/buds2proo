import { Platform } from "react-native";

import { Buds2BridgeModule } from "@/modules/buds2-bridge";
import type {
  BluetoothSnapshot,
  Buds2ControlResult,
  Buds2EqualizerPreset,
  Buds2NoiseControlMode,
  Buds2TouchAction,
} from "@/modules/buds2-bridge";

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

export async function discoverBluetoothDevices(): Promise<BluetoothSnapshot> {
  try {
    return await Buds2BridgeModule.discoverBluetoothDevices();
  } catch {
    return {
      ...EMPTY_BLUETOOTH_SNAPSHOT,
      nativeModuleAvailable: false,
      reason: "discovery_call_failed",
    };
  }
}

export async function applyNoiseControl(
  deviceId: string,
  mode: Buds2NoiseControlMode,
): Promise<Buds2ControlResult> {
  try {
    return await Buds2BridgeModule.applyNoiseControl(deviceId, mode);
  } catch {
    return {
      command: "noise_control",
      status: "failed",
      message: "ANC komutu Buds2 köprüsünde çalıştırılamadı.",
    };
  }
}

export async function applyEqualizer(
  deviceId: string,
  preset: Buds2EqualizerPreset,
): Promise<Buds2ControlResult> {
  try {
    return await Buds2BridgeModule.applyEqualizer(deviceId, preset);
  } catch {
    return {
      command: "equalizer",
      status: "failed",
      message: "Ekolayzır komutu Buds2 köprüsünde çalıştırılamadı.",
    };
  }
}

export async function applyTouchLock(
  deviceId: string,
  locked: boolean,
): Promise<Buds2ControlResult> {
  try {
    return await Buds2BridgeModule.applyTouchLock(deviceId, locked);
  } catch {
    return {
      command: "touch_lock",
      status: "failed",
      message: "Dokunmatik kilidi Buds2 köprüsünde çalıştırılamadı.",
    };
  }
}

export async function applyTouchOptions(
  deviceId: string,
  left: Buds2TouchAction,
  right: Buds2TouchAction,
): Promise<Buds2ControlResult> {
  try {
    return await Buds2BridgeModule.applyTouchOptions(deviceId, left, right);
  } catch {
    return {
      command: "touch_options",
      status: "failed",
      message: "Dokunmatik eylemleri Buds2 köprüsünde çalıştırılamadı.",
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
