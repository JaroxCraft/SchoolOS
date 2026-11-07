import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  describeTransferFile,
  exportData,
  importData,
  parseTransferFile,
  TransferError,
  type TransferKind,
} from "@/db/transfer";
import { confirm, showMessage } from "@/lib/confirm";
import { today } from "@/lib/dates";

const FILE_NAMES: Record<TransferKind, string> = {
  timetable: "SchoolOS-Stundenplan.json",
  backup: `SchoolOS-Backup-${today()}.json`,
};

// Writes the export to a file in the cache and opens the system share sheet with it, so it can
// be sent to classmates (AirDrop, messengers) or saved to Files / Drive.
export async function shareExport(kind: TransferKind) {
  const file = new File(Paths.cache, FILE_NAMES[kind]);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(exportData(kind), null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: kind === "timetable" ? "Stundenplan teilen" : "Backup sichern",
  });
}

// Lets the user pick an export file, shows what it contains and replaces the data after
// confirming. onDone runs after a successful import.
export async function pickAndImport(onDone?: () => void) {
  // Messengers often send JSON files without their type, so every file can be picked
  // Android reads the picked file through its content:// URI: the copy in the cache lies outside
  // the folders the app may read in Expo Go ("Missing 'READ' permission").
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: Platform.OS === "ios",
  });
  if (result.canceled) return;

  let file;
  try {
    file = parseTransferFile(await new File(result.assets[0].uri).text());
  } catch (error) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showMessage(
      "Import nicht möglich",
      error instanceof TransferError ? error.message : "Die Datei konnte nicht gelesen werden."
    );
    return;
  }

  confirm(
    file.kind === "timetable"
      ? {
          title: "Stundenplan importieren?",
          message: `Die Datei enthält ${describeTransferFile(file)}. Dein Lektionenraster, deine Fächer, Lehrpersonen und dein Stundenplan werden ersetzt. Einträge und Noten bleiben erhalten.`,
          confirmLabel: "Importieren",
          destructive: false,
          onConfirm: () => runImport(file, onDone),
        }
      : {
          title: "Backup wiederherstellen?",
          message: `Die Datei enthält ${describeTransferFile(file)}. Alle Daten auf diesem Gerät werden durch das Backup ersetzt.`,
          confirmLabel: "Wiederherstellen",
          onConfirm: () => runImport(file, onDone),
        }
  );
}

function runImport(file: Parameters<typeof importData>[0], onDone?: () => void) {
  try {
    importData(file);
  } catch {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showMessage(
      "Import nicht möglich",
      "Die Datei passt nicht zusammen, zum Beispiel weil eine Lektion auf ein fehlendes Fach verweist. Es wurde nichts geändert."
    );
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  onDone?.();
}
