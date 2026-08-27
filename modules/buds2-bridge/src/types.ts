export type BluetoothDeviceType = "classic" | "low-energy" | "dual" | "unknown";

export type BluetoothPermissionState = "granted" | "denied" | "not-requested" | "unavailable";

export interface BluetoothAudioDevice {
  id: string;
  name: string;
  deviceType: BluetoothDeviceType;
  isLikelyBuds2: boolean;
  a2dpConnected: boolean;
  headsetConnected: boolean;
  /** Android genel API'si ayrı kulaklık/kutu verisi vermediğinde null döner. */
  batteryLevel: number | null;
}

export interface BluetoothSnapshot {
  nativeModuleAvailable: boolean;
  bluetoothSupported: boolean;
  bluetoothEnabled: boolean;
  permissionGranted: boolean;
  devices: BluetoothAudioDevice[];
  updatedAt: number | null;
  reason?: string;
}

export interface Buds2NativeModule {
  getBluetoothSnapshot(): Promise<BluetoothSnapshot>;
  openBluetoothSettings(): boolean;
}
