import { useLocalSearchParams } from "expo-router";

import { EntryForm } from "@/components/entry-form";
import { useEntries, useSettings, useSubjects, useTimetable } from "@/db/queries";

export default function EntryScreen() {
  const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
  const subjects = useSubjects();
  const settings = useSettings();
  const { periods, lessons, loaded } = useTimetable();
  const entry = useEntries().find((candidate) => String(candidate.id) === id);

  // Wait for the data the form derives its defaults from
  if (!loaded || (id !== "new" && !entry)) return null;

  return (
    <EntryForm
      entry={entry}
      initialSubjectId={subjectId ? Number(subjectId) : null}
      subjects={subjects}
      periods={periods}
      lessons={lessons}
      settings={settings}
    />
  );
}
