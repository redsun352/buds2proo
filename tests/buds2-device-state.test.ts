import { describe, expect, it } from "vitest";

import {
  deriveDeviceUiState,
  findLikelyBuds2,
} from "../lib/buds2/device-state";
import type { BluetoothAudioDevice, BluetoothSnapshot } from "../modules/buds2-bridge/src";

const BASE_SNAPSHOT: BluetoothSnapshot = {
  nativeModuleAvailable: true,
  bluetoothSupported: true,
  bluetoothEnabled: true,
  permissionGranted: true,
  devices: [],
  updatedAt: 0,
};

const CONNECTED_BUDS2: BluetoothAudioDevice = {
  id: "device-id",
  name: "Galaxy Buds2",
  deviceType: "dual",
  isBonded: true,
  isLikelyBuds2: true,
  a2dpConnected: true,
  headsetConnected: true,
  batteryLevel: null,
};

describe("Buds2 bağlantı durumu", () => {
  it("bağlı Galaxy Buds2 için başarı durumunu üretir", () => {
    const device = findLikelyBuds2([CONNECTED_BUDS2]);
    const state = deriveDeviceUiState({
      platform: "android",
      snapshot: { ...BASE_SNAPSHOT, devices: [CONNECTED_BUDS2] },
      permissionState: "granted",
      budsDevice: device,
    });

    expect(state).toMatchObject({ label: "Bağlı", tone: "success" });
  });

  it("eksik izni bağlantı yokmuş gibi göstermeden belirtir", () => {
    const state = deriveDeviceUiState({
      platform: "android",
      snapshot: { ...BASE_SNAPSHOT, permissionGranted: false },
      permissionState: "not-requested",
    });

    expect(state).toMatchObject({ label: "İzin gerekli", tone: "warning" });
  });

  it("Bluetooth kapalıysa kullanıcıyı doğru eyleme yönlendiren durumu üretir", () => {
    const state = deriveDeviceUiState({
      platform: "android",
      snapshot: { ...BASE_SNAPSHOT, bluetoothEnabled: false },
      permissionState: "granted",
    });

    expect(state).toMatchObject({ label: "Bluetooth kapalı", tone: "warning" });
  });

  it("eşlenmemiş fakat bulunan Buds2'yi ayrı bir durum olarak gösterir", () => {
    const device = { ...CONNECTED_BUDS2, a2dpConnected: false, headsetConnected: false, isBonded: false };
    const state = deriveDeviceUiState({
      platform: "android",
      snapshot: { ...BASE_SNAPSHOT, devices: [device] },
      permissionState: "granted",
      budsDevice: device,
    });

    expect(state).toMatchObject({ label: "Yakında bulundu", tone: "neutral" });
  });
});
