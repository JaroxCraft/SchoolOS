import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FooterText, FormList } from "@/components/form-list";
import { ActionRow, DestructiveRow } from "@/components/rows";
import { TimeRangeRow } from "@/components/time-range-row";
import { addPeriod, deletePeriod, updatePeriods } from "@/db/actions";
import { useLessons, usePeriods } from "@/db/queries";
import type { Period } from "@/db/schema";
import { useStepButton } from "@/hooks/use-header-button";
import { confirm } from "@/lib/confirm";
import { addMinutes, timeToDate } from "@/lib/dates";
import { useSchoolRoutes } from "@/lib/routes";

const LESSON_MINUTES = 50;
const FIRST_START = "07:25";

const minutesBetween = (start: string, end: string) =>
  Math.round((timeToDate(end).getTime() - timeToDate(start).getTime()) / 60_000);

// Moving the start keeps the length of the period, so a shifted period does not have to be fixed
// twice; an end before the start is moved behind it. Periods never overlap: a start before the end
// of the previous period is moved to that end, and following periods that would overlap are pushed
// back, keeping their length. All changes are saved together.
function changePeriod(periods: Period[], index: number, start: string, end: string) {
  const period = periods[index];
  const previous = periods[index - 1];
  if (previous && minutesBetween(previous.endTime, start) < 0) start = previous.endTime;
  if (start !== period.startTime) {
    const length = minutesBetween(period.startTime, period.endTime);
    end = addMinutes(start, length > 0 ? length : LESSON_MINUTES);
  } else if (minutesBetween(start, end) <= 0) {
    end = addMinutes(start, LESSON_MINUTES);
  }
  const changes = [{ id: period.id, startTime: start, endTime: end }];
  for (const next of periods.slice(index + 1)) {
    const previousEnd = changes.at(-1)!.endTime;
    if (minutesBetween(previousEnd, next.startTime) >= 0) break;
    const length = minutesBetween(next.startTime, next.endTime);
    changes.push({
      id: next.id,
      startTime: previousEnd,
      endTime: addMinutes(previousEnd, length > 0 ? length : LESSON_MINUTES),
    });
  }
  updatePeriods(changes);
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
              onChange={(start, end) => changePeriod(periods, index, start, end)}
            />
          ))}
          <ActionRow label="Lektion hinzufügen" onPress={add} />
          <FieldGroup.SectionFooter>
            <FooterText>
              Das Raster gilt für jeden Schultag. Tippe auf eine Zeit, um sie zu ändern; die Lektion
              behält dabei ihre Länge, folgende Lektionen rücken bei Überschneidung nach. Neue
              Lektionen schliessen direkt an die letzte an.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        {last && (
          <FieldGroup.Section>
            <DestructiveRow label="Letzte Lektion entfernen" onPress={removeLast} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
