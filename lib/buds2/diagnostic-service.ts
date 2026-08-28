import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { Buds2BridgeModule } from "@/modules/buds2-bridge";
import type { BluetoothSnapshot } from "@/modules/buds2-bridge";

const DIAGNOSTIC_FILENAME = "buds2-diagnostic-report.txt";

export interface DiagnosticReport {
  startedAt: string;
  completedAt: string;
  snapshot: BluetoothSnapshot;
  nativeEvents: string;
  notes: string[];
}

export async function readDiagnosticLog(): Promise<string> {
  return Buds2BridgeModule.getDiagnosticLog();
}

export async function clearDiagnosticLog(): Promise<boolean> {
  return Buds2BridgeModule.clearDiagnosticLog();
}

export async function collectDiagnosticTest(
  refreshSnapshot?: () => Promise<BluetoothSnapshot>,
): Promise<DiagnosticReport> {
  const startedAt = new Date().toISOString();
  const snapshot = refreshSnapshot ? await refreshSnapshot() : await Buds2BridgeModule.getBluetoothSnapshot();
  const nativeEvents = await readDiagnosticLog();
  const notes: string[] = [];
  if (!snapshot.nativeModuleAvailable) notes.push("Native Android köprüsü kullanılabilir değil.");
  if (!snapshot.permissionGranted) notes.push("Bluetooth izinleri verilmemiş veya doğrulanamadı.");
  if (!snapshot.bluetoothEnabled) notes.push("Bluetooth kapalı veya etkin değil.");
  if (!snapshot.devices.some((device) => device.isLikelyBuds2)) notes.push("Snapshot içinde Buds2 cihazı bulunamadı.");
  if (!nativeEvents.trim()) notes.push("Henüz native DSP/RFCOMM olayı kaydedilmedi.");
  return { startedAt, completedAt: new Date().toISOString(), snapshot, nativeEvents, notes };
}

export function formatDiagnosticReport(report: DiagnosticReport): string {
  return [
    "Buds2 Companion otomatik tanı raporu",
    `Başlangıç: ${report.startedAt}`,
    `Bitiş: ${report.completedAt}`,
    "",
    "[GENEL DURUM]",
    JSON.stringify({
      nativeModuleAvailable: report.snapshot.nativeModuleAvailable,
      bluetoothSupported: report.snapshot.bluetoothSupported,
      bluetoothEnabled: report.snapshot.bluetoothEnabled,
      permissionGranted: report.snapshot.permissionGranted,
      reason: report.snapshot.reason ?? null,
    }, null, 2),
    "",
    "[CIHAZLAR]",
    JSON.stringify(report.snapshot.devices, null, 2),
    "",
    "[NOTLAR]",
    report.notes.length ? report.notes.map((note) => `- ${note}`).join("\n") : "- Yok",
    "",
    "[NATIVE DSP/RFCOMM OLAYLARI]",
    report.nativeEvents.trim() || "Kayıt yok",
    "",
    "Bu dosya sistemdeki tüm logcat’i değil, Buds2 Companion tanı olaylarını içerir.",
  ].join("\n");
}

export async function writeDiagnosticReport(report: DiagnosticReport): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${DIAGNOSTIC_FILENAME}`;
  await FileSystem.writeAsStringAsync(uri, formatDiagnosticReport(report), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

export async function shareDiagnosticReport(report: DiagnosticReport): Promise<"shared" | "unavailable"> {
  const uri = await writeDiagnosticReport(report);
  if (!(await Sharing.isAvailableAsync())) return "unavailable";
  await Sharing.shareAsync(uri, {
    mimeType: "text/plain",
    dialogTitle: "Buds2 otomatik tanı raporunu paylaş",
  });
  return "shared";
}

export { DIAGNOSTIC_FILENAME };
