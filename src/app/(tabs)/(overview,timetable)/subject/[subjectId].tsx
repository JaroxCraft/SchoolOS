import { FieldGroup, Text } from "@expo/ui";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { EntryRow } from "@/components/entry-row";
import { FormList } from "@/components/form-list";
import { LabeledRow } from "@/components/labeled-row";
import { ActionRow } from "@/components/rows";
import { useEntries, useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import { weekdayName } from "@/lib/dates";
import { isCheckable } from "@/lib/entry-types";
import { openEntry } from "@/lib/routes";
import { periodNumber } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";
import { useInk } from "@/hooks/use-ink";
import { useNow } from "@/hooks/use-now";
import { useWasCompleted } from "@/hooks/use-recently-completed";

export default function SubjectScreen() {
  const ink = useInk();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const id = Number(subjectId);
  const subject = useSubjects().find((candidate) => candidate.id === id);
  const teacher = useTeachers().find((candidate) => candidate.id === subject?.teacherId);
  const periods = usePeriods();
  const lessons = useLessons()
    .filter((lesson) => lesson.subjectId === id)
    .sort(
      (a, b) =>
        a.weekday - b.weekday ||
        periodNumber(periods, a.periodId) - periodNumber(periods, b.periodId)
    );
  const wasCompleted = useWasCompleted();
  const now = useNow();
  const openEntries = useEntries().filter(
    (entry) =>
      entry.subjectId === id &&
      (isCheckable(entry.type) ? !wasCompleted(entry) : entry.date >= now.date)
  );

  if (!subject) {
    return (
      <EmptyState
        icon={{ ios: "questionmark.folder", android: "folder_off" }}
        title="Fach nicht gefunden"
        message="Dieses Fach wurde gelöscht."
      />
    );
  }

  return (
    <>
      <Stack.Title>{subject.name}</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          <LabeledRow label="Kürzel">
            <Text textStyle={{ color: ink.secondary }}>{subject.abbreviation}</Text>
          </LabeledRow>
          {teacher && (
            <LabeledRow label="Lehrperson">
              <Text textStyle={{ color: ink.secondary }}>
                {teacher.abbreviation ? `${teacher.name} (${teacher.abbreviation})` : teacher.name}
              </Text>
            </LabeledRow>
          )}
          {teacher?.email && (
            <LabeledRow label="E-Mail">
              <Text textStyle={{ color: ink.secondary }}>{teacher.email}</Text>
            </LabeledRow>
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="Lektionen">
          {lessons.map((lesson) => {
            const period = periods.find((candidate) => candidate.id === lesson.periodId);
            return (
              <LabeledRow
                key={lesson.id}
                label={`${weekdayName(lesson.weekday)}, ${periodNumber(periods, lesson.periodId)}. Lektion`}>
                <Text textStyle={{ color: ink.secondary }}>
                  {joinDetails(period?.startTime, lesson.room)}
                </Text>
              </LabeledRow>
            );
          })}
        </FieldGroup.Section>

        <FieldGroup.Section title="Offene Einträge">
          {openEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} subject={subject} today={now.date} />
          ))}
          <ActionRow
            label="Eintrag hinzufügen"
            onPress={() => openEntry({ id: "new", subjectId: subject.id })}
          />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
