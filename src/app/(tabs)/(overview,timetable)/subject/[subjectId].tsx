import { FieldGroup, Text } from "@expo/ui";
import { router, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";

import { EntryRow } from "@/components/entry-row";
import { FormList } from "@/components/form-list";
import { LabeledRow } from "@/components/labeled-row";
import { ActionRow } from "@/components/rows";
import { useEntries, useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import { useEntryPlacement } from "@/hooks/use-entry-placement";
import { useInk } from "@/hooks/use-ink";
import { useNow } from "@/hooks/use-now";
import { weekdayName } from "@/lib/dates";
import { openEntry } from "@/lib/routes";
import { periodNumber } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";

export default function SubjectDetailScreen() {
  const ink = useInk();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const id = Number(subjectId);
  const current = useSubjects().find((candidate) => candidate.id === id);
  // The subject stays on screen while the screen closes after it was deleted (see below), so the
  // title does not fall back to the route name during the transition
  const [subject, setSubject] = useState(current);
  if (current && current !== subject) setSubject(current);
  const teacher = useTeachers().find((candidate) => candidate.id === subject?.teacherId);
  const periods = usePeriods();
  const lessons = useLessons()
    .filter((lesson) => lesson.subjectId === id)
    .sort(
      (a, b) =>
        a.weekday - b.weekday ||
        periodNumber(periods, a.periodId) - periodNumber(periods, b.periodId)
    );
  const placeEntries = useEntryPlacement();
  const now = useNow();
  const openEntries = placeEntries(useEntries().filter((entry) => entry.subjectId === id)).open;

  // The subject was deleted or the app reset, maybe while this screen waited in its tab: it has
  // nothing left to show, so it closes itself. Goes back in this screen's own stack, not in
  // whichever one is focused (router.back), since the settings sheet may still be open above.
  const navigation = useNavigation();
  const missing = current === undefined;
  useEffect(() => {
    if (!missing) return;
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace("/");
  }, [missing, navigation]);

  if (!subject) return null;

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
                {joinDetails(teacher.abbreviation, teacher.name)}
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
          {lessons.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine Lektionen</Text>
          )}
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
          {openEntries.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine offenen Einträge</Text>
          )}
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
