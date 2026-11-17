import { router } from "expo-router";

import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { useSaving } from "@/hooks/use-saving";
import { confirmDelete, type Deletion } from "@/lib/confirm-delete";
import { saveFailed } from "@/lib/save-failed";

export function useClosingForm(dirty: boolean) {
  const allowLeave = useDiscardGuard(dirty);
  const { saving, run } = useSaving({ closesOnSuccess: true });

  return {
    saving,
    saveAndClose: (save: () => Promise<unknown>) =>
      run(async () => {
        await save();
        allowLeave();
        router.back();
      }).catch(saveFailed),
    deleteAndClose: (deletion: Deletion) => confirmDelete(deletion, allowLeave),
  };
}
