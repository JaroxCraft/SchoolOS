import { useState } from "react";

import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { useSaving } from "@/hooks/use-saving";
import { saveFailed } from "@/lib/save-failed";

type DraftEditorOptions<T> = {
  // What is saved now, shown until the first change
  saved: T;
  // The same key for the same content, to tell whether the draft differs from `saved`
  keyOf: (value: T) => string;
  save: (value: T) => void;
  // Keeps the save locked after it succeeded, for a screen that leaves (see useSaving)
  closesOnSuccess: boolean;
  // Starts over from `saved` after saving, for a screen that stays below the next one
  resetsAfterSave?: boolean;
  // Tidies up what is shown, e.g. drops lessons of a subject deleted meanwhile
  tidy?: (value: T) => T;
};

// An editor of a whole list at once, such as the period grid and the timetable. Changes stay a
// draft until they are saved; leaving with changes asks to discard them (useDiscardGuard). Saving
// runs at most once at a time (useSaving) and tells when it fails (saveFailed).
export function useDraftEditor<T>({
  saved,
  keyOf,
  save,
  closesOnSuccess,
  resetsAfterSave = false,
  tidy = (value) => value,
}: DraftEditorOptions<T>) {
  // null until the first change: until then the screen shows what is saved
  const [draft, setDraft] = useState<T | null>(null);
  const current = tidy(draft ?? saved);
  const dirty = draft !== null && keyOf(current) !== keyOf(saved);
  const allowLeave = useDiscardGuard(dirty);
  const { saving, run } = useSaving({ closesOnSuccess });

  // Saves the draft, then leaves with `leave`; a failed save stays on the screen with the draft
  const saveAndLeave = (leave: () => void) =>
    run(async () => {
      if (dirty) save(current);
      if (resetsAfterSave) setDraft(null);
      allowLeave();
      leave();
    }).catch(saveFailed);

  return { current, setDraft, dirty, saving, saveAndLeave };
}
