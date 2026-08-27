import { useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import {
  EMPTY_BLUETOOTH_SNAPSHOT,
  getBluetoothSnapshot,
  openBluetoothSettings,
} from "@/lib/buds2/device-service";
import type { BluetoothPermissionState, BluetoothSnapshot } from "@/modules/buds2-bridge";

async function getPermissionState(): Promise<BluetoothPermissionState> {
  if (Platform.OS !== "android") return "unavailable";
  if (Number(Platform.Version) < 31) return "granted";

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  );
  return granted ? "granted" : "not-requested";
}

export function useBuds2Device() {
  const [snapshot, setSnapshot] = useState<BluetoothSnapshot>(EMPTY_BLUETOOTH_SNAPSHOT);
  const [permissionState, setPermissionState] = useState<BluetoothPermissionState>("unavailable");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const currentPermissionState = await getPermissionState();
      const nextSnapshot = await getBluetoothSnapshot();
      setPermissionState(
        nextSnapshot.permissionGranted || currentPermissionState === "granted"
          ? "granted"
          : currentPermissionState,
      );
      setSnapshot(nextSnapshot);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const requestBluetoothPermission = useCallback(async () => {
    if (Platform.OS !== "android" || Number(Platform.Version) < 31) {
      await refresh();
      return;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Yakındaki cihazlara erişim",
        message:
          "Buds2 Companion, eşlenmiş kulaklıkların bağlantı durumunu göstermek için Bluetooth erişimine ihtiyaç duyar.",
        buttonPositive: "İzin ver",
        buttonNegative: "Şimdi değil",
      },
    );

    setPermissionState(result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied");
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    snapshot,
    permissionState,
    isRefreshing,
    refresh,
    requestBluetoothPermission,
    openBluetoothSettings,
  };
}
