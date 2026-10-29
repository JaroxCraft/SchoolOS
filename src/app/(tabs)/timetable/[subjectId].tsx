import { FieldGroup, ListItem, Text } from "@expo/ui";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Linking } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { EntryRow } from "@/components/entry-row";
import { FormList } from "@/components/form-list";
import { LabeledRow } from "@/components/labeled-row";
import { useEntries, useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import { today, weekdayName } from "@/lib/dates";
import { isCheckable } from "@/lib/entry-types";
import { periodNumber } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";
import { useInk } from "@/hooks/use-ink";

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
  const openEntries = useEntries().filter(
    (entry) =>
      entry.subjectId === id && (isCheckable(entry.type) ? !entry.completed : entry.date >= today())
  );

  if (!subject) {
    return <EmptyState title="Fach nicht gefunden" message="Dieses Fach wurde gelöscht." />;
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
            <ListItem
              onPress={() => Linking.openURL(`mailto:${teacher.email}`)}
              supportingText={teacher.email}>
              E-Mail schreiben
            </ListItem>
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
            <EntryRow key={entry.id} entry={entry} subject={subject} />
          ))}
          <ListItem
            onPress={() =>
              router.push({
                pathname: "/entry/[id]",
                params: { id: "new", subjectId: String(subject.id) },
              })
            }>
            Eintrag hinzufügen
          </ListItem>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
