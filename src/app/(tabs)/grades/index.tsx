import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";

export default function GradesScreen() {
  return (
    <Screen title="Noten">
      <EmptyState
        icon={{ ios: "chart.bar", android: "bar_chart" }}
        title="Keine Noten"
        message="Deine Noten erscheinen hier, nach Semester gruppiert."
      />
    </Screen>
  );
}
