import { useLocalSearchParams } from "expo-router";

import { EntryForm } from "@/components/entry-form";
import { useEntries, useLessons, usePeriods, useSettings, useSubjects } from "@/db/queries";

export default function EntryScreen() {
  const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
  const subjects = useSubjects();
  const settings = useSettings();
  const periods = usePeriods();
  const lessons = useLessons();
  const entry = useEntries().find((candidate) => String(candidate.id) === id);

  // The entry was deleted
  if (id !== "new" && !entry) return null;

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
