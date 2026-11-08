import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { DiscardGuard } from "@/components/discard-guard";
import { FooterText, FormList } from "@/components/form-list";
import { ActionRow, DestructiveRow } from "@/components/rows";
import { TimeRangeRow } from "@/components/time-range-row";
import { savePeriods } from "@/db/actions";
import { useLessons, usePeriods } from "@/db/queries";
import type { PeriodDraft } from "@/db/schema";
import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { useSaveButton, useStepButton } from "@/hooks/use-header-button";
import { confirm } from "@/lib/confirm";
import { addMinutes, timeToDate } from "@/lib/dates";
import { useSchoolRoutes } from "@/lib/routes";

const LESSON_MINUTES = 50;
const FIRST_START = "07:25";

const minutesBetween = (start: string, end: string) =>
  Math.round((timeToDate(end).getTime() - timeToDate(start).getTime()) / 60_000);

const gridKey = (grid: PeriodDraft[]) =>
  grid.map(({ id, startTime, endTime }) => `${id}:${startTime}-${endTime}`).join(",");

// Moving the start keeps the length of the period, so a shifted period does not have to be fixed
// twice; an end before the start is moved behind it. Periods never overlap: a start before the end
// of the previous period is moved to that end, and following periods that would overlap are pushed
// back, keeping their length.
function changePeriod(grid: PeriodDraft[], index: number, start: string, end: string) {
  const period = grid[index];
  const previous = grid[index - 1];
  if (previous && minutesBetween(previous.endTime, start) < 0) start = previous.endTime;
  if (start !== period.startTime) {
    const length = minutesBetween(period.startTime, period.endTime);
    end = addMinutes(start, length > 0 ? length : LESSON_MINUTES);
  } else if (minutesBetween(start, end) <= 0) {
    end = addMinutes(start, LESSON_MINUTES);
  }
  const changed = [...grid];
  changed[index] = { ...period, startTime: start, endTime: end };
  for (let next = index + 1; next < changed.length; next++) {
    const previousEnd = changed[next - 1].endTime;
    const { startTime, endTime } = changed[next];
    if (minutesBetween(previousEnd, startTime) >= 0) break;
    const length = minutesBetween(startTime, endTime);
    changed[next] = {
      ...changed[next],
      startTime: previousEnd,
      endTime: addMinutes(previousEnd, length > 0 ? length : LESSON_MINUTES),
    };
  }
  return changed;
}

// The period grid. Changes stay a draft until they are saved with ✓ (settings) or "Weiter" (setup),
// like the forms of subjects and teachers; leaving with changes asks to discard them.
export default function PeriodsScreen() {
  const periods = usePeriods();
  const lessons = useLessons();
  const routes = useSchoolRoutes();
  const saveButton = useSaveButton();
  const nextButton = useStepButton("next");
  // null until the first change: until then the screen shows the saved grid
  const [draft, setDraft] = useState<PeriodDraft[] | null>(null);
  const grid: PeriodDraft[] = draft ?? periods;
  const dirty = draft !== null && gridKey(draft) !== gridKey(periods);
  const allowLeave = useDiscardGuard(dirty);
  const last = grid.at(-1);

  const save = () => {
    if (dirty) savePeriods(grid);
    setDraft(null);
  };

  const add = () => {
    const start = last ? last.endTime : FIRST_START;
    setDraft([...grid, { id: null, startTime: start, endTime: addMinutes(start, LESSON_MINUTES) }]);
  };

  const removeLast = () => {
    if (!last) return;
    const remove = () => setDraft(grid.slice(0, -1));
    const used = lessons.filter((lesson) => lesson.periodId === last.id).length;
    if (used === 0) {
      remove();
      return;
    }
    confirm({
      title: `${grid.length}. Lektion entfernen?`,
      message: `${used === 1 ? "Eine Lektion" : `${used} Lektionen`} im Stundenplan zu dieser Zeit ${used === 1 ? "wird" : "werden"} beim Sichern ebenfalls entfernt.`,
      confirmLabel: "Entfernen",
      onConfirm: remove,
    });
  };

  return (
    <>
      <Stack.Title>Lektionenraster</Stack.Title>
      <Stack.Toolbar placement="right">
        {/* Setup: the first step, leading on to the subjects */}
        {routes.setup && nextButton && (
          <Stack.Toolbar.Button
            {...nextButton}
            disabled={grid.length === 0}
            onPress={() => {
              save();
              router.push(routes.subjects);
            }}
          />
        )}
        {!routes.setup && saveButton && (
          <Stack.Toolbar.Button
            {...saveButton}
            onPress={() => {
              save();
              allowLeave();
              router.back();
            }}
          />
        )}
      </Stack.Toolbar>
      <DiscardGuard dirty={dirty}>
        <FormList>
          <FieldGroup.Section>
            {grid.map((period, index) => (
              <TimeRangeRow
                // Added periods have no id yet; only the last one can be removed
                key={period.id ?? `new-${index}`}
                label={`${index + 1}. Lektion`}
                start={period.startTime}
                end={period.endTime}
                onChange={(start, end) => setDraft(changePeriod(grid, index, start, end))}
              />
            ))}
            <ActionRow label="Lektion hinzufügen" onPress={add} />
            <FieldGroup.SectionFooter>
              <FooterText>
                Das Raster gilt für jeden Schultag. Tippe auf eine Zeit, um sie zu ändern; die
                Lektion behält dabei ihre Länge, folgende Lektionen rücken bei Überschneidung nach.
                Neue Lektionen schliessen direkt an die letzte an.
              </FooterText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          {last && (
            <FieldGroup.Section>
              <DestructiveRow label="Letzte Lektion entfernen" onPress={removeLast} />
            </FieldGroup.Section>
          )}
        </FormList>
      </DiscardGuard>
    </>
  );
}
