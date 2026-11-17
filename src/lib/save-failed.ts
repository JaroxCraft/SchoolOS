import { showError } from "@/lib/confirm";

// Tells the user that a save failed, with the error haptic like a failed import. Shared by every
// screen that saves (forms, pickers, the Lektionenraster and the Stundenplan editor), so the
// message names no kind of item.
export function saveFailed() {
  showError(
    "Sichern nicht möglich",
    "Die Eingaben konnten nicht gesichert werden. Versuche es noch einmal."
  );
}
