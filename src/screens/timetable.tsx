import { Column, FieldGroup, ListItem, Row, Text } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import { DiscardGuard } from "@/components/discard-guard";
import { EmptyState } from "@/components/empty-state";
import { FooterText, FormList } from "@/components/form-list";
import { type RowAction, RowActions } from "@/components/row-actions";
import { ActionRow } from "@/components/rows";
import { SegmentedControl } from "@/components/segmented-control";
import { SubjectDot } from "@/components/subject-dot";
import { SubjectPickerSheet } from "@/components/subject-picker";
import { TextField } from "@/components/text-field";
import { saveLessons } from "@/db/actions";
import { useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import type { LessonSlot, Period, Subject } from "@/db/schema";
import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { useSaveButton, useStepButton } from "@/hooks/use-header-button";
import { type Ink, useInk } from "@/hooks/use-ink";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayName, weekdayShort } from "@/lib/dates";
import { endEditing } from "@/lib/focused-fields";
import { useSchoolRoutes } from "@/lib/routes";
import { lessonAt, periodNumber, periodRange } from "@/lib/schedule";
import { typography } from "@/lib/typography";

const FREE = 0;

type LessonRowsProps = {
  period: Period;
  number: number;
  lesson: LessonSlot | undefined;
  subject: Subject | undefined;
  onPress: () => void;
  // Makes the period free again
  onClear: () => void;
  onRoomChange: (room: string | null) => void;
  ink: Ink;
};

// One row per period with its time and the subject (color dot and name) on the right. A period
// with a subject gets a "Zimmer" field: on iOS as a row right below it (rows of a section are
// joined), on Android inside the lesson's own card, since Android draws every row as a card of its
// own. On iOS a lesson is made free by swiping it left; a long press offers to pick another
// subject or to remove it. Returned as an array, not a component: the Android section only
// recognizes its rows (and draws a list item as a row of its own) when they are its direct
// children.
function lessonRows({
  period,
  number,
  lesson,
  subject,
  onPress,
  onClear,
  onRoomChange,
  ink,
}: LessonRowsProps) {
  const roomField = lesson && subject && (
    <Row key={`room-${period.id}`} alignment="center" spacing={12}>
      <Text textStyle={{ color: ink.secondary }}>Zimmer</Text>
      <TextField
        // Another weekday or subject gets a fresh field with its room
        key={`${lesson.weekday}-${lesson.subjectId}`}
        placeholder={`Zimmer für ${subject.abbreviation}`}
        defaultValue={lesson.room ?? ""}
        // Android: right after the label, since the field's width depends on the subject's name
        textAlign={Platform.OS === "android" ? "left" : "right"}
        // The room goes into the draft while typing; the key only ends the editing
        returnKeyType="done"
        onSubmitEditing={endEditing}
        autoCorrect={false}
        onChangeText={(room) => onRoomChange(room.trim() || null)}
      />
    </Row>
  );

  const remove: RowAction = {
    label: "Entfernen",
    icon: "minus.circle",
    destructive: true,
    onPress: onClear,
  };

  const row = (
    <ListItem
      key={`lesson-${period.id}`}
      onPress={onPress}
      supportingText={
        Platform.OS === "android" && roomField ? (
          <Column spacing={4}>
            <Text {...typography("footnote", { color: ink.secondary })}>{periodRange(period)}</Text>
            {roomField}
          </Column>
        ) : (
          periodRange(period)
        )
      }
      trailing={
        <Row spacing={8} alignment="center">
          {subject && <SubjectDot color={subject.color} />}
          <Text textStyle={{ color: subject ? ink.label : ink.secondary }}>
            {subject?.name ?? "Frei"}
          </Text>
        </Row>
      }>
      {`${number}. Lektion`}
    </ListItem>
  );

  return [
    lesson ? (
      <RowActions
        key={`lesson-${period.id}`}
        trailing={[remove]}
        menu={[{ label: "Fach wählen", icon: "books.vertical", onPress }, remove]}>
        {row}
      </RowActions>
    ) : (
      row
    ),
    Platform.OS === "ios" && roomField,
  ];
}

// The room a subject usually has, to fill in when it is put into another period
function usualRoom(subjectId: number, lessons: LessonSlot[]): string | null {
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    if (lesson.subjectId === subjectId && lesson.room) {
      counts.set(lesson.room, (counts.get(lesson.room) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// The timetable without ids and in a fixed order, to tell whether the draft differs from it
const timetableKey = (timetable: LessonSlot[]) =>
  timetable
    .map(({ weekday, periodId, subjectId, room }) => `${weekday}:${periodId}:${subjectId}:${room}`)
    .sort()
    .join(",");

// The timetable of one weekday at a time, one row per period. Tapping a period opens the subject
// sheet; picking a subject closes it, and the room can be changed in the row below the lesson.
// Changes stay a draft until they are saved with ✓ (settings) or "Fertig" (setup), like the forms
// of subjects and teachers; leaving with changes asks to discard them.
export default function TimetableEditorScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();
  const teachers = useTeachers();
  const ink = useInk();
  const routes = useSchoolRoutes();
  const saveButton = useSaveButton();
  const doneButton = useStepButton("done");
  // Start on the current weekday, or on Monday at the weekend
  const [weekday, setWeekday] = useState(() => {
    const current = isoWeekday(today());
    return current <= 5 ? current : 1;
  });
  // The period whose sheet is open
  const [editing, setEditing] = useState<Period | null>(null);
  // null until the first change: until then the screen shows the saved timetable
  const [draft, setDraft] = useState<LessonSlot[] | null>(null);
  // A subject deleted meanwhile ("Fach hinzufügen" opens the subject form) leaves the draft
  const timetable = (draft ?? lessons).filter((lesson) =>
    subjects.some((subject) => subject.id === lesson.subjectId)
  );
  const dirty = draft !== null && timetableKey(timetable) !== timetableKey(lessons);
  const allowLeave = useDiscardGuard(dirty);

  // Sets the lesson of a slot on the shown weekday; null makes it free
  const setSlot = (periodId: number, lesson: Omit<LessonSlot, "weekday" | "periodId"> | null) =>
    setDraft([
      ...timetable.filter((slot) => slot.weekday !== weekday || slot.periodId !== periodId),
      ...(lesson ? [{ weekday, periodId, ...lesson }] : []),
    ]);

  // Saves and leaves with `leave`
  const saveAndLeave = (leave: () => void) => {
    if (dirty) saveLessons(timetable);
    allowLeave();
    leave();
  };

  if (periods.length === 0 || subjects.length === 0) {
    const noPeriods = periods.length === 0;
    return (
      <>
        <Stack.Title>Stundenplan</Stack.Title>
        <EmptyState
          icon={
            noPeriods
              ? { ios: "clock", android: "schedule" }
              : { ios: "books.vertical", android: "menu_book" }
          }
          title={noPeriods ? "Kein Lektionenraster" : "Noch keine Fächer"}
          message={
            noPeriods
              ? "Lege zuerst fest, wann deine Lektionen beginnen und enden."
              : "Erfasse zuerst deine Fächer, dann kannst du sie hier den Lektionen zuteilen."
          }
          action={{
            label: noPeriods ? "Lektionenraster" : "Fächer erfassen",
            // Instead of this screen, so back still leads to where the timetable was opened from
            onPress: () => router.replace(noPeriods ? routes.periods : routes.subjects),
          }}
        />
      </>
    );
  }

  const subjectOf = (lesson: LessonSlot | undefined) =>
    subjects.find((subject) => subject.id === lesson?.subjectId);
  const lessonCount = timetable.filter((lesson) => lesson.weekday === weekday).length;
  const editedLesson = editing ? lessonAt(timetable, weekday, editing.id) : undefined;
  const editedTitle = editing
    ? `${weekdayName(weekday)}, ${periodNumber(periods, editing.id)}. Lektion`
    : "";

  return (
    <>
      <Stack.Title>Stundenplan</Stack.Title>
      <Stack.Toolbar placement="right">
        {/* Setup: the last step, back to the overview (or the timetable tab) it started from */}
        {routes.setup && doneButton && (
          <Stack.Toolbar.Button
            {...doneButton}
            onPress={() => saveAndLeave(() => router.dismissAll())}
          />
        )}
        {!routes.setup && saveButton && (
          <Stack.Toolbar.Button {...saveButton} onPress={() => saveAndLeave(() => router.back())} />
        )}
      </Stack.Toolbar>
      <DiscardGuard dirty={dirty}>
        <FormList>
          <FieldGroup.Section>
            <SegmentedControl
              value={weekday}
              onChange={setWeekday}
              options={SCHOOL_WEEKDAYS.map((day) => ({ label: weekdayShort(day), value: day }))}
            />
          </FieldGroup.Section>

          <FieldGroup.Section
            title={`${weekdayName(weekday)} · ${lessonCount === 1 ? "1 Lektion" : `${lessonCount} Lektionen`}`}>
            {periods.map((period, index) => {
              const lesson = lessonAt(timetable, weekday, period.id);
              return lessonRows({
                period,
                number: index + 1,
                lesson,
                subject: subjectOf(lesson),
                onPress: () => setEditing(period),
                onClear: () => setSlot(period.id, null),
                onRoomChange: (room) => lesson && setSlot(period.id, { ...lesson, room }),
                ink,
              });
            })}
            <FieldGroup.SectionFooter>
              <FooterText>
                Tippe auf eine Lektion, um das Fach zu wählen. Das Zimmer wird vom Fach übernommen
                und lässt sich darunter ändern.
              </FooterText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section>
            <ActionRow
              label="Fach hinzufügen"
              onPress={() => router.push({ pathname: routes.subject, params: { id: "new" } })}
            />
          </FieldGroup.Section>
        </FormList>
      </DiscardGuard>

      {/* Outside the form: inside it, the sheet would take up an empty row */}
      <SubjectPickerSheet
        isPresented={editing !== null}
        onDismiss={() => setEditing(null)}
        title={editedTitle}
        value={editedLesson?.subjectId ?? FREE}
        subjects={subjects}
        teachers={teachers}
        lessons={timetable}
        extraChoices={[{ label: "Frei", value: FREE }]}
        onChange={(subjectId) => {
          // The same subject again keeps the lesson and its room as they are
          if (!editing || subjectId === (editedLesson?.subjectId ?? FREE)) return;
          setSlot(
            editing.id,
            subjectId === FREE
              ? null
              : // The room the subject usually has; it can be changed in the row below the lesson
                { subjectId, room: usualRoom(subjectId, timetable) }
          );
        }}
      />
    </>
  );
}
