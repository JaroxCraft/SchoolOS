import { t } from "@/i18n";
import { showError } from "@/lib/confirm";

export function saveFailed() {
  showError(t.common.saveFailed.title, t.common.saveFailed.message);
}
