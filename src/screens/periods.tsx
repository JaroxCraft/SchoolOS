import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";

import { DestructiveButton } from "@/components/destructive-button";
import { FooterText, FormList } from "@/components/form-list";
import { ActionRow } from "@/components/rows";
import { TimeRangeRow } from "@/components/time-range-row";
import { addPeriod, deletePeriod, updatePeriod } from "@/db/actions";
import { useLessons, usePeriods } from "@/db/queries";
import type { Period } from "@/db/schema";
import { useStepButton } from "@/hooks/use-step-button";
import { confirm } from "@/lib/confirm";
import { addMinutes, timeToDate } from "@/lib/dates";
import { useSchoolRoutes } from "@/lib/routes";

const LESSON_MINUTES = 50;
const FIRST_START = "07:25";

const minutesBetween = (start: string, end: string) =>
  Math.round((timeToDate(end).getTime() - timeToDate(start).getTime()) / 60_000);

// Moving the start keeps the length of the period, so a shifted period does not have to be fixed
// twice; an end before the start is moved behind it.
function changePeriod(period: Period, start: string, end: string) {
  if (start !== period.startTime) {
    const length = minutesBetween(period.startTime, period.endTime);
    end = addMinutes(start, length > 0 ? length : LESSON_MINUTES);
  } else if (minutesBetween(start, end) <= 0) {
    end = addMinutes(start, LESSON_MINUTES);
  }
  updatePeriod(period.id, start, end);
}

export default function PeriodsScreen() {
  const periods = usePeriods();
  const lessons = useLessons();
  const routes = useSchoolRoutes();
  const nextButton = useStepButton("next");
  const last = periods.at(-1);

  const add = () => {
    const start = last ? last.endTime : FIRST_START;
    addPeriod(start, addMinutes(start, LESSON_MINUTES));
  };

  const removeLast = () => {
    if (!last) return;
    const used = lessons.filter((lesson) => lesson.periodId === last.id).length;
    if (used === 0) {
      deletePeriod(last.id);
      return;
    }
    confirm({
      title: `${periods.length}. Lektion entfernen?`,
      message: `${used === 1 ? "Eine Lektion" : `${used} Lektionen`} im Stundenplan zu dieser Zeit ${used === 1 ? "wird" : "werden"} ebenfalls entfernt.`,
      confirmLabel: "Entfernen",
      onConfirm: () => deletePeriod(last.id),
    });
  };

  return (
    <>
      <Stack.Title>Lektionenraster</Stack.Title>
      {/* Setup: the first step, leading on to the subjects */}
      {routes.setup && (
        <Stack.Toolbar placement="right">
          {nextButton && (
            <Stack.Toolbar.Button
              {...nextButton}
              disabled={periods.length === 0}
              onPress={() => router.push(routes.subjects)}
            />
          )}
        </Stack.Toolbar>
      )}
      <FormList>
        <FieldGroup.Section>
          {periods.map((period, index) => (
            <TimeRangeRow
              key={period.id}
              label={`${index + 1}. Lektion`}
              start={period.startTime}
              end={period.endTime}
              onChange={(start, end) => changePeriod(period, start, end)}
            />
          ))}
          <ActionRow label="Lektion hinzufügen" onPress={add} />
          <FieldGroup.SectionFooter>
            <FooterText>
              Das Raster gilt für jeden Schultag. Tippe auf eine Zeit, um sie zu ändern; die Lektion
              behält dabei ihre Länge. Neue Lektionen schliessen direkt an die letzte an.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        {last && (
          <FieldGroup.Section>
            <DestructiveButton label="Letzte Lektion entfernen" onPress={removeLast} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
