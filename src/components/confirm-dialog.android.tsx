import { AlertDialog, Host, Text, TextButton } from "@expo/ui/jetpack-compose";

import { closeConfirmDialog, useConfirmDialog } from "@/lib/confirm-dialog-store";

// Android: the Material 3 dialog for confirm(), rendered once in the root layout.
export function ConfirmDialog() {
  const options = useConfirmDialog();

  if (!options) return null;

  return (
    <Host matchContents>
      <AlertDialog onDismissRequest={closeConfirmDialog}>
        <AlertDialog.Title>
          <Text style={{ typography: "headlineSmall" }}>{options.title}</Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Text style={{ typography: "bodyMedium" }}>{options.message}</Text>
        </AlertDialog.Text>
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={() => {
              closeConfirmDialog();
              options.onConfirm();
            }}>
            <Text>{options.confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton onClick={closeConfirmDialog}>
            <Text>Abbrechen</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}
