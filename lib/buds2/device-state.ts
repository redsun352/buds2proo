import type {
  BluetoothAudioDevice,
  BluetoothPermissionState,
  BluetoothSnapshot,
} from "@/modules/buds2-bridge";

export interface DeviceUiState {
  label: string;
  message: string;
  tone: "success" | "warning" | "neutral" | "error";
}

export function findLikelyBuds2(
  devices: BluetoothAudioDevice[],
): BluetoothAudioDevice | undefined {
  return devices.find((device) => device.isLikelyBuds2);
}

export function deriveDeviceUiState({
  platform,
  snapshot,
  permissionState,
  budsDevice,
}: {
  platform: string;
  snapshot: BluetoothSnapshot;
  permissionState: BluetoothPermissionState;
  budsDevice?: BluetoothAudioDevice;
}): DeviceUiState {
  if (platform !== "android") {
    return {
      label: "Android derlemesi gerekli",
      tone: "neutral",
      message: "Bluetooth köprüsü yalnızca Android uygulama derlemesinde çalışır.",
    };
  }

  if (!snapshot.nativeModuleAvailable) {
    return {
      label: "Yerel modül bekleniyor",
      tone: "neutral",
      message: "Bu özellik, özel Android derlemesinde etkinleşir.",
    };
  }

  if (permissionState !== "granted") {
    return {
      label: "İzin gerekli",
      tone: permissionState === "denied" ? "error" : "warning",
      message: "Eşlenmiş kulaklıkları görmek için Yakındaki cihazlar izni verin.",
    };
  }

  if (!snapshot.bluetoothSupported) {
    return {
      label: "Bluetooth desteklenmiyor",
      tone: "error",
      message: "Bu cihaz Bluetooth adaptörü sunmuyor.",
    };
  }

  if (!snapshot.bluetoothEnabled) {
    return {
      label: "Bluetooth kapalı",
      tone: "warning",
      message: "Bağlantı durumunu görmek için Bluetooth'u açın.",
    };
  }

  if (budsDevice?.a2dpConnected || budsDevice?.headsetConnected) {
    return {
      label: "Bağlı",
      tone: "success",
      message: "Galaxy Buds2 ses profili etkin görünüyor.",
    };
  }

  if (budsDevice) {
    return {
      label: "Eşlenmiş",
      tone: "neutral",
      message: "Galaxy Buds2 eşlenmiş ancak ses profili bağlı değil.",
    };
  }

  return {
    label: "Buds2 bulunamadı",
    tone: "neutral",
    message: "Galaxy Buds2'yi Android Bluetooth ayarlarından eşleyin veya bağlayın.",
  };
}
