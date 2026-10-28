import { FieldGroup, ListItem } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { FormList } from "@/components/form-list";
import { SelectRow } from "@/components/select-row";
import { SubjectDot } from "@/components/subject-dot";
import { useLessons, usePeriods, useSubjects } from "@/db/queries";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayName } from "@/lib/dates";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";

export default function TimetableSettingsScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();
  // Start on the current weekday, or on Monday at the weekend
  const [weekday, setWeekday] = useState(() => {
    const current = isoWeekday(today());
    return current <= 5 ? current : 1;
  });

  if (periods.length === 0) {
    return (
      <>
        <Stack.Title>Stundenplan</Stack.Title>
        <EmptyState
          title="Kein Lektionenraster"
          message="Lege zuerst im Lektionenraster fest, wann deine Lektionen beginnen und enden."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Title>Stundenplan</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          <SelectRow
            label="Tag"
            value={weekday}
            onChange={setWeekday}
            options={SCHOOL_WEEKDAYS.map((day) => ({ label: weekdayName(day), value: day }))}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title={weekdayName(weekday)}>
          {periods.map((period, index) => {
            const lesson = lessons.find(
              (candidate) => candidate.weekday === weekday && candidate.periodId === period.id
            );
            const subject = subjects.find((candidate) => candidate.id === lesson?.subjectId);
            return (
              <ListItem
                key={period.id}
                onPress={() =>
                  router.push({
                    pathname: "/settings/lesson",
                    params: { weekday: String(weekday), periodId: String(period.id) },
                  })
                }
                leading={<SubjectDot color={subject?.color ?? NEUTRAL_COLOR} />}
                supportingText={[`${period.startTime}–${period.endTime}`, lesson?.room]
                  .filter(Boolean)
                  .join(" · ")}>
                {`${index + 1}. ${subject?.name ?? "Frei"}`}
              </ListItem>
            );
          })}
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
