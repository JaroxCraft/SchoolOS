import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { EntryForm } from "@/components/entry-form";
import { useEntries, useLessons, usePeriods, useSubjects } from "@/db/queries";

export default function EntryScreen() {
  const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
  const subjects = useSubjects();
  const periods = usePeriods();
  const lessons = useLessons();
  const found = useEntries().find((candidate) => String(candidate.id) === id);
  // A deleted entry stays in the form while its sheet closes, instead of the message below
  const [lastFound, setLastFound] = useState(found);
  if (found && found !== lastFound) setLastFound(found);
  const entry = found ?? lastFound;

  // A link to an entry that does not exist (any more). iOS hides the header of this route (see
  // src/app/_layout.tsx), so the message itself offers the way out.
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
