import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { data } from "@/db/client";
import {
  describeTransferFile,
  parseTransferFile,
  TransferError,
  type TransferFile,
  transferFileOrigin,
  type TransferKind,
} from "@/db/transfer";
import { t } from "@/i18n";
import { exportSource } from "@/lib/app-info";
import { confirm, showError } from "@/lib/confirm";
import { today } from "@/lib/dates";
import { showOverview } from "@/lib/routes";

// Exports are a few hundred KB at most; a larger file is not one and would block reading it
const MAX_EXPORT_FILE_BYTES = 5 * 1024 * 1024;

function fileName(kind: TransferKind) {
  const names = t.transfer.fileNames;
  return kind === "timetable" ? names.timetable : names.backup(today());
}

// Writes the export to a file in the cache and opens the system share sheet with it, so it can
// be sent to classmates (AirDrop, messengers) or saved to Files / Drive. Closing the share sheet
// resolves normally; only a failing write or share sheet ends up in the catch.
export async function shareExport(kind: TransferKind) {
  try {
    const file = new File(Paths.cache, fileName(kind));
    file.create({ overwrite: true });
    await file.write(JSON.stringify(data.exportData(kind, exportSource()), null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      UTI: "public.json",
      dialogTitle: t.transfer.actions[kind],
    });
  } catch {
    showError(t.transfer.shareFailed.title, t.transfer.shareFailed.message);
  }
}

export async function pickAndImport() {
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
    if ((picked.size ?? new File(picked.uri).size) > MAX_EXPORT_FILE_BYTES) {
      showError(t.transfer.importFailed.title, t.transfer.errors.notSchoolOSFile);
      return;
    }
    text = await new File(picked.uri).text();
  } catch {
    showError(t.transfer.openFailed.title, t.transfer.openFailed.message);
    return;
  }

  let file: TransferFile;
  try {
    file = parseTransferFile(text);
  } catch (error) {
    showError(
      t.transfer.importFailed.title,
      error instanceof TransferError ? error.message : t.transfer.importFailed.unreadable
    );
    return;
  }

  const described = { origin: transferFileOrigin(file), contents: describeTransferFile(file) };
  confirm(
    file.kind === "timetable"
      ? {
          title: t.transfer.confirmTimetable.title,
          message: t.transfer.confirmTimetable.message(described),
          confirmLabel: t.transfer.confirmTimetable.confirm,
          destructive: false,
          onConfirm: () => runImport(file),
        }
      : {
          title: t.transfer.confirmBackup.title,
          message: t.transfer.confirmBackup.message(described),
          confirmLabel: t.transfer.confirmBackup.confirm,
          onConfirm: () => runImport(file),
        }
  );
}

function runImport(file: TransferFile) {
  try {
    data.importData(file);
  } catch {
    showError(t.transfer.importFailed.title, t.transfer.importFailed.notImported);
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  showOverview();
}
