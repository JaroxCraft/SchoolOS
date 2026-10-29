import { router } from "expo-router";

import { confirm } from "@/lib/confirm";

// Asks before deleting the item of the current screen, then closes the screen and deletes it.
export function confirmDelete(title: string, message: string, onDelete: () => Promise<void>) {
  confirm({
    title,
    message,
    confirmLabel: "Löschen",
    onConfirm: async () => {
      router.back();
      await onDelete();
    },
  });
}
