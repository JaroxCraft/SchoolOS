import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { FormList } from "@/components/form-list";
import { NavigationRow } from "@/components/rows";
import { SelectRow } from "@/components/select-row";
import { SubjectDot } from "@/components/subject-dot";
import { useLessons, usePeriods, useSubjects } from "@/db/queries";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayName } from "@/lib/dates";
import { lessonAt, periodRange } from "@/lib/schedule";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { joinDetails } from "@/lib/text";

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
          icon={{ ios: "clock", android: "schedule" }}
          title="Kein Lektionenraster"
          message="Lege zuerst fest, wann deine Lektionen beginnen und enden."
          action={{ label: "Lektionenraster", onPress: () => router.replace("/settings/periods") }}
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
            const lesson = lessonAt(lessons, weekday, period.id);
            const subject = subjects.find((candidate) => candidate.id === lesson?.subjectId);
            return (
              <NavigationRow
                key={period.id}
                onPress={() =>
                  router.push({
                    pathname: "/settings/lesson",
                    params: { weekday: String(weekday), periodId: String(period.id) },
                  })
                }
                leading={<SubjectDot color={subject?.color ?? NEUTRAL_COLOR} />}
                supportingText={joinDetails(periodRange(period), lesson?.room)}>
                {`${index + 1}. ${subject?.name ?? "Frei"}`}
              </NavigationRow>
            );
          })}
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
