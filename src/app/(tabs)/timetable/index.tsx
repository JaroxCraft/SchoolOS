import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";

export default function TimetableScreen() {
  return (
    <Screen title="Stundenplan">
      <EmptyState
        title="Kein Stundenplan"
        message="Erfasse in den Einstellungen deine Lektionen, damit dein Stundenplan hier erscheint."
      />
    </Screen>
  );
}
