import { showError } from "@/lib/confirm";

export function saveFailed() {
  showError(
    "Sichern nicht möglich",
    "Die Eingaben konnten nicht gesichert werden. Versuche es noch einmal."
  );
}
