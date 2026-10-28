import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";

export default function AgendaScreen() {
  return (
    <Screen title="Agenda">
      <EmptyState
        title="Keine Termine"
        message="Hausaufgaben, Prüfungen, Präsentationen und Abgaben erscheinen hier."
      />
    </Screen>
  );
}
