import { useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import {
  EMPTY_BLUETOOTH_SNAPSHOT,
  discoverBluetoothDevices,
  getBluetoothSnapshot,
  openBluetoothSettings,
} from "@/lib/buds2/device-service";
import type { BluetoothPermissionState, BluetoothSnapshot } from "@/modules/buds2-bridge";

async function getPermissionState(): Promise<BluetoothPermissionState> {
  if (Platform.OS !== "android") return "unavailable";
  if (Number(Platform.Version) < 31) return "granted";

  const [canConnect, canScan] = await Promise.all([
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
  ]);
  return canConnect && canScan ? "granted" : "not-requested";
}

export function useBuds2Device() {
  const [snapshot, setSnapshot] = useState<BluetoothSnapshot>(EMPTY_BLUETOOTH_SNAPSHOT);
  const [permissionState, setPermissionState] = useState<BluetoothPermissionState>("unavailable");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const refresh = useCallback(async (): Promise<BluetoothSnapshot> => {
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
      return nextSnapshot;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const requestBluetoothPermission = useCallback(async () => {
    if (Platform.OS !== "android" || Number(Platform.Version) < 31) {
      await refresh();
      return;
    }

    const result = await PermissionsAndroid.requestMultiple(
      [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ],
    );

    const granted =
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
    setPermissionState(granted ? "granted" : "denied");
    await refresh();
  }, [refresh]);

  const discover = useCallback(async () => {
    setIsDiscovering(true);
    try {
      const currentPermissionState = await getPermissionState();
      if (currentPermissionState !== "granted") {
        setPermissionState(currentPermissionState);
        return;
      }
      const nextSnapshot = await discoverBluetoothDevices();
      setPermissionState(nextSnapshot.permissionGranted ? "granted" : "not-requested");
      setSnapshot(nextSnapshot);
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    snapshot,
    permissionState,
    isRefreshing,
    isDiscovering,
    refresh,
    discover,
    requestBluetoothPermission,
    openBluetoothSettings,
  };
}
