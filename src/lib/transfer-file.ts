import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  describeTransferFile,
  exportData,
  importData,
  NOT_A_SCHOOLOS_FILE,
  parseTransferFile,
  TransferError,
  type TransferFile,
  type TransferKind,
} from "@/db/transfer";
import { confirm, showMessage } from "@/lib/confirm";
import { today } from "@/lib/dates";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Built when sharing, so a backup made after midnight carries the new date
function fileName(kind: TransferKind) {
  return kind === "timetable" ? "SchoolOS-Stundenplan.json" : `SchoolOS-Backup-${today()}.json`;
}

// Writes the export to a file in the cache and opens the system share sheet with it, so it can
// be sent to classmates (AirDrop, messengers) or saved to Files / Drive. Closing the share sheet
// resolves normally; only a failing write or share sheet ends up in the catch.
export async function shareExport(kind: TransferKind) {
  try {
    const file = new File(Paths.cache, fileName(kind));
    if (file.exists) file.delete();
    file.create();
    await file.write(JSON.stringify(exportData(kind), null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      UTI: "public.json",
      dialogTitle: kind === "timetable" ? "Stundenplan teilen" : "Backup sichern",
    });
  } catch {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showMessage("Teilen ist fehlgeschlagen", "Versuche es noch einmal.");
  }
}

// Lets the user pick an export file, shows what it contains and replaces the data after
// confirming. onDone runs after a successful import.
export async function pickAndImport(onDone?: () => void) {
  let text;
  try {
    // Only JSON files can be picked. Android messengers often save them without their type
    // (application/octet-stream), so those stay pickable there; on iOS that type would allow
    // every file. Android reads the picked file through its content:// URI: the copy in the cache
    // lies outside the folders the app may read in Expo Go ("Missing 'READ' permission").
    const result = await DocumentPicker.getDocumentAsync({
      type:
        Platform.OS === "android"
          ? ["application/json", "application/octet-stream"]
          : "application/json",
      copyToCacheDirectory: Platform.OS === "ios",
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    // Exports are a few hundred KB at most; a large file is not one and would block reading it
    if ((picked.size ?? new File(picked.uri).size) > MAX_FILE_SIZE) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showMessage("Import nicht möglich", NOT_A_SCHOOLOS_FILE);
      return;
    }
    text = await new File(picked.uri).text();
  } catch {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showMessage("Die Datei konnte nicht geöffnet werden", "Versuche es noch einmal.");
    return;
  }

  let file: TransferFile;
  try {
    file = parseTransferFile(text);
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

function runImport(file: TransferFile, onDone?: () => void) {
  try {
    importData(file);
  } catch (error) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showMessage(
      "Import nicht möglich",
      error instanceof TransferError
        ? error.message
        : "Die Datei konnte nicht importiert werden. Es wurde nichts geändert."
    );
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  onDone?.();
}
