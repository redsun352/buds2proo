export type BluetoothDeviceType = "classic" | "low-energy" | "dual" | "unknown";

export type BluetoothPermissionState = "granted" | "denied" | "not-requested" | "unavailable";
export type Buds2NoiseControlMode = "off" | "anc" | "ambient";
export type Buds2EqualizerPreset = "normal" | "bass_boost" | "soft" | "dynamic" | "clear" | "treble_boost";
export type Buds2ControlStatus = "confirmed" | "sent_no_ack" | "blocked" | "failed";

export interface Buds2ControlResult {
  command: "noise_control" | "equalizer";
  status: Buds2ControlStatus;
  message: string;
}

export interface BluetoothAudioDevice {
  id: string;
  name: string;
  deviceType: BluetoothDeviceType;
  isBonded: boolean;
  isLikelyBuds2: boolean;
  a2dpConnected: boolean;
  headsetConnected: boolean;
  /** Android genel API'si ayrı kulaklık/kutu verisi vermediğinde null döner. */
  batteryLevel: number | null;
  /** Buds2 extended-status yanıtından gelen üreticiye özgü değerler. */
  batteryLeft?: number | null;
  batteryRight?: number | null;
  batteryCase?: number | null;
  equalizerMode?: number | null;
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
  discoverBluetoothDevices(): Promise<BluetoothSnapshot>;
  applyNoiseControl(deviceId: string, mode: Buds2NoiseControlMode): Promise<Buds2ControlResult>;
  applyEqualizer(deviceId: string, preset: Buds2EqualizerPreset): Promise<Buds2ControlResult>;
  openBluetoothSettings(): boolean;
}
