import { router } from "expo-router";

import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { useSaving } from "@/hooks/use-saving";
import { confirmDelete, type Deletion } from "@/lib/confirm-delete";

// A form that closes itself once its item is saved or deleted (entry, subject, teacher). Leaving it
// with unsaved changes asks "Änderungen verwerfen?" first (useDiscardGuard); saving with ✓ runs at
// most once (useSaving) and closes without asking, as does deleting after its confirmation. A
// pushed form also wraps its content in <DiscardGuard>.
export function useClosingForm(dirty: boolean) {
  const allowLeave = useDiscardGuard(dirty);
  const { saving, run } = useSaving({ closesOnSuccess: true });

  return {
    // For disabling ✓ while the save runs
    saving,
    saveAndClose: (save: () => Promise<unknown>) =>
      run(async () => {
        await save();
        allowLeave();
        router.back();
      }),
    deleteAndClose: (deletion: Deletion) => confirmDelete(deletion, allowLeave),
  };
}
