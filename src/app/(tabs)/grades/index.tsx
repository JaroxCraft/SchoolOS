import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";

export default function GradesScreen() {
  return (
    <Screen title="Noten">
      <EmptyState
        title="Keine Noten"
        message="Deine Noten erscheinen hier, nach Semester gruppiert."
      />
    </Screen>
  );
}
