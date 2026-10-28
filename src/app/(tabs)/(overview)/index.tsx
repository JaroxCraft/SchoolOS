import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";

export default function OverviewScreen() {
  return (
    <Screen title="Übersicht">
      <EmptyState
        title="Noch nichts geplant"
        message="Erfasse in den Einstellungen dein Lektionenraster, deine Fächer und deinen Stundenplan."
      />
    </Screen>
  );
}
