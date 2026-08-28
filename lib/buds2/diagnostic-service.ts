import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { Buds2BridgeModule } from "@/modules/buds2-bridge";

const DIAGNOSTIC_FILENAME = "buds2-diagnostics.txt";

export async function readDiagnosticLog(): Promise<string> {
  return Buds2BridgeModule.getDiagnosticLog();
}

export async function clearDiagnosticLog(): Promise<boolean> {
  return Buds2BridgeModule.clearDiagnosticLog();
}

export async function shareDiagnosticLog(): Promise<"shared" | "unavailable" | "empty"> {
  const content = await readDiagnosticLog();
  if (!content.trim()) return "empty";
  const uri = `${FileSystem.cacheDirectory}${DIAGNOSTIC_FILENAME}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) return "unavailable";
  await Sharing.shareAsync(uri, { mimeType: "text/plain", dialogTitle: "Buds2 tanı kaydını paylaş" });
  return "shared";
}

export { DIAGNOSTIC_FILENAME };
