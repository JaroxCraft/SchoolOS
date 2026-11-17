import { router, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { EntryForm } from "@/components/entry-form";
import { useEntries, useLessons, usePeriods, useSubjects } from "@/db/queries";
import { useLastDefined } from "@/hooks/use-last-defined";

export default function EntryScreen() {
  const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
  const subjects = useSubjects();
  const periods = usePeriods();
  const lessons = useLessons();
  const found = useEntries().find((candidate) => String(candidate.id) === id);
  const entry = useLastDefined(found);

  if (id !== "new" && !entry) {
    return (
      <EmptyState
        icon={{ ios: "questionmark.circle", android: "help" }}
        title="Eintrag nicht gefunden"
        message="Dieser Eintrag existiert nicht mehr."
        action={{ label: "Schliessen", onPress: () => router.back() }}
      />
    );
  }

  return (
    <EntryForm
      entry={entry}
      initialSubjectId={subjectId ? Number(subjectId) : null}
      subjects={subjects}
      periods={periods}
      lessons={lessons}
    />
  );
}
