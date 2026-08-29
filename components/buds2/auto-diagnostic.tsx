import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";

import { useBuds2Device } from "@/hooks/use-buds2-device";
import { collectDiagnosticTest, saveDiagnosticReport } from "@/lib/buds2/diagnostic-service";

/**
 * Watches the real Bluetooth profile state while the app is foregrounded.
 * A connection edge starts one diagnostic session; reconnecting starts a new one.
 */
export function AutoDiagnosticWatcher() {
  const { snapshot, refresh } = useBuds2Device();
  const wasConnected = useRef(false);
  const running = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const timer = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const buds = snapshot.devices.find((device) => device.isLikelyBuds2);
    const connected = Boolean(buds && (buds.a2dpConnected || buds.headsetConnected));
    const connectionStarted = connected && !wasConnected.current;
    wasConnected.current = connected;
    if (!connectionStarted || running.current) return;

    running.current = true;
    void (async () => {
      try {
        const report = await collectDiagnosticTest(refresh);
        await saveDiagnosticReport(report);
        Alert.alert(
          "Buds2 tanısı tamamlandı",
          "Bağlantı testi bitti. Rapor için bir klasör seçildi ve dosya kaydedildi.",
        );
      } catch {
        Alert.alert(
          "Tanı raporu kaydedilemedi",
          "Bağlantı testi tamamlandı ancak kayıt klasörü seçilmedi veya dosya yazılamadı. Yardım ekranından yeniden deneyebilirsiniz.",
        );
      } finally {
        running.current = false;
      }
    })();
  }, [refresh, snapshot]);

  return null;
}
