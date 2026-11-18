import { FieldGroup, Text } from "@expo/ui";
import { router, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";

import { EntryRow } from "@/components/entry-row";
import { FormList, rowsKey } from "@/components/form-list";
import { LabeledRow } from "@/components/labeled-row";
import { ActionRow } from "@/components/rows";
import { useEntries, useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import { useEntryPlacement } from "@/hooks/use-entry-placement";
import { useInk } from "@/hooks/use-ink";
import { useLastDefined } from "@/hooks/use-last-defined";
import { useNow } from "@/hooks/use-now";
import { t } from "@/i18n";
import { weekdayName } from "@/lib/dates";
import { findById } from "@/lib/find";
import { openEntry } from "@/lib/routes";
import { periodLabel, periodNumber } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";

export default function SubjectDetailScreen() {
  const ink = useInk();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const id = Number(subjectId);
  const current = findById(useSubjects(), id);
  const subject = useLastDefined(current);
  const teacher = findById(useTeachers(), subject?.teacherId);
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
      <FormList rowsKey={rowsKey(openEntries)}>
        <FieldGroup.Section>
          <LabeledRow label={t.school.subjectDetail.abbreviation}>
            <Text textStyle={{ color: ink.secondary }}>{subject.abbreviation}</Text>
          </LabeledRow>
          {teacher && (
            <LabeledRow label={t.school.subjectDetail.teacher}>
              <Text textStyle={{ color: ink.secondary }}>
                {joinDetails(teacher.abbreviation, teacher.name)}
              </Text>
            </LabeledRow>
          )}
          {teacher?.email && (
            <LabeledRow label={t.school.subjectDetail.email}>
              <Text textStyle={{ color: ink.secondary }}>{teacher.email}</Text>
            </LabeledRow>
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title={t.school.subjectDetail.lessons}>
          {lessons.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>{t.school.noLessons}</Text>
          )}
          {lessons.map((lesson) => {
            const period = findById(periods, lesson.periodId);
            return (
              <LabeledRow
                key={lesson.id}
                label={t.school.period.onWeekday({
                  weekday: weekdayName(lesson.weekday),
                  period: periodLabel(periodNumber(periods, lesson.periodId)),
                })}>
                <Text textStyle={{ color: ink.secondary }}>
                  {joinDetails(period?.startTime, lesson.room)}
                </Text>
              </LabeledRow>
            );
          })}
        </FieldGroup.Section>

        <FieldGroup.Section title={t.entries.openEntries}>
          {openEntries.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>{t.school.subjectDetail.noOpenEntries}</Text>
          )}
          {openEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} subject={subject} today={now.date} />
          ))}
          <ActionRow
            label={t.entries.add}
            onPress={() => openEntry({ id: "new", subjectId: subject.id })}
          />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
