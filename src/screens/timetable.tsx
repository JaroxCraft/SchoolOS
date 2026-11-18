import { Column, FieldGroup, ListItem, Row, Text } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { SecondaryText } from "@/components/form-list";
import { PushedForm } from "@/components/pushed-form";
import { RowActions } from "@/components/row-actions";
import { ActionRow, rowDetail } from "@/components/rows";
import { NONE } from "@/components/search-picker";
import { SegmentedControl } from "@/components/segmented-control";
import { SubjectDot } from "@/components/subject-dot";
import { SubjectPickerSheet } from "@/components/subject-picker";
import { TextField } from "@/components/text-field";
import { saveLessons } from "@/db/actions";
import { useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import type { LessonDraft, Period, Subject } from "@/db/schema";
import { useDraftEditor } from "@/hooks/use-draft-editor";
import { useStepButton } from "@/hooks/use-header-button";
import { type Ink, useInk } from "@/hooks/use-ink";
import { t } from "@/i18n";
import { SCHOOL_WEEKDAYS, today, weekdayName, weekdayShort } from "@/lib/dates";
import { findById } from "@/lib/find";
import { endEditing } from "@/lib/focused-fields";
import { openScreen, useSchoolRoutes } from "@/lib/routes";
import type { RowAction } from "@/lib/row-action";
import { lessonAt, periodLabel, periodNumber, periodRange, shownWeekday } from "@/lib/schedule";

type LessonRowsProps = {
  period: Period;
  number: number;
  lesson: LessonDraft | undefined;
  subject: Subject | undefined;
  onPress: () => void;
  onClear: () => void;
  onRoomChange: (room: string | null) => void;
  ink: Ink;
};

// One row per period with its time and the subject (color dot and name) on the right. A period
// with a subject gets a "Room" field: on iOS as a row right below it (rows of a section are
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
      <Text textStyle={{ color: ink.secondary }}>{t.school.timetableEditor.room}</Text>
      <TextField
        key={`${lesson.weekday}-${lesson.subjectId}`}
        placeholder={t.school.timetableEditor.roomPlaceholder(subject.abbreviation)}
        defaultValue={lesson.room ?? ""}
        // Android: right after the label, since the field's width depends on the subject's name
        textAlign={Platform.OS === "android" ? "left" : "right"}
        returnKeyType="done"
        onSubmitEditing={endEditing}
        autoCorrect={false}
        onChangeText={(room) => onRoomChange(room.trim() || null)}
      />
    </Row>
  );

  const remove: RowAction = {
    label: t.common.remove,
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
            <SecondaryText>{periodRange(period)}</SecondaryText>
            {roomField}
          </Column>
        ) : (
          rowDetail(periodRange(period))
        )
      }
      trailing={
        <Row spacing={8} alignment="center">
          {subject && <SubjectDot color={subject.color} />}
          <Text textStyle={{ color: subject ? ink.label : ink.secondary }}>
            {subject?.name ?? t.school.timetableEditor.free}
          </Text>
        </Row>
      }>
      {periodLabel(number)}
    </ListItem>
  );

  return [
    lesson ? (
      <RowActions
        key={`lesson-${period.id}`}
        trailing={[remove]}
        menu={[
          { label: t.school.timetableEditor.chooseSubject, icon: "books.vertical", onPress },
          remove,
        ]}>
        {row}
      </RowActions>
    ) : (
      row
    ),
    Platform.OS === "ios" && roomField,
  ];
}

function usualRoom(subjectId: number, lessons: LessonDraft[]): string | null {
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    if (lesson.subjectId === subjectId && lesson.room) {
      counts.set(lesson.room, (counts.get(lesson.room) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

const timetableKey = (timetable: LessonDraft[]) =>
  timetable
    .map(({ weekday, periodId, subjectId, room }) => `${weekday}:${periodId}:${subjectId}:${room}`)
    .sort()
    .join(",");

export default function TimetableEditScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();
  const teachers = useTeachers();
  const ink = useInk();
  const routes = useSchoolRoutes();
  const finishButton = useStepButton("finish");
  const [weekday, setWeekday] = useState(() => shownWeekday(today()));
  const [editing, setEditing] = useState<Period | null>(null);
  const {
    current: timetable,
    setDraft,
    dirty,
    saving,
    saveAndLeave,
  } = useDraftEditor<LessonDraft[]>({
    saved: lessons,
    keyOf: timetableKey,
    save: saveLessons,
    // Both buttons leave the screen, so the lock stays after saving: ✓ can still be tapped while
    // the screen slides away
    closesOnSuccess: true,
    // A subject deleted meanwhile ("Add subject" opens the subject form) leaves the draft
    tidy: (slots) =>
      slots.filter((lesson) => subjects.some((subject) => subject.id === lesson.subjectId)),
  });

  const setSlot = (periodId: number, lesson: Omit<LessonDraft, "weekday" | "periodId"> | null) =>
    setDraft([
      ...timetable.filter((slot) => slot.weekday !== weekday || slot.periodId !== periodId),
      ...(lesson ? [{ weekday, periodId, ...lesson }] : []),
    ]);

  if (periods.length === 0 || subjects.length === 0) {
    const noPeriods = periods.length === 0;
    const empty = noPeriods
      ? t.school.timetableEditor.noPeriods
      : t.school.timetableEditor.noSubjects;
    return (
      <>
        <Stack.Title>{t.common.tabs.timetable}</Stack.Title>
        <EmptyState
          icon={
            noPeriods
              ? { ios: "clock", android: "schedule" }
              : { ios: "books.vertical", android: "menu_book" }
          }
          title={empty.title}
          message={empty.message}
          action={{
            label: noPeriods ? t.school.setupSteps.periods : t.school.setupSteps.subjects,
            // Replaces this screen, so back still leads to where the timetable was opened from
            onPress: () => router.replace(noPeriods ? routes.periods : routes.subjects),
          }}
        />
      </>
    );
  }

  const subjectOf = (lesson: LessonDraft | undefined) => findById(subjects, lesson?.subjectId);
  const lessonCount = timetable.filter((lesson) => lesson.weekday === weekday).length;
  const editedLesson = editing ? lessonAt(timetable, weekday, editing.id) : undefined;
  const editedTitle = editing
    ? t.school.period.onWeekday({
        weekday: weekdayName(weekday),
        period: periodLabel(periodNumber(periods, editing.id)),
      })
    : "";

  return (
    <>
      <PushedForm
        title={t.common.tabs.timetable}
        canSave={dirty && !saving}
        dirty={dirty}
        onSave={routes.setup ? undefined : () => saveAndLeave(() => router.back())}
        toolbar={
          routes.setup &&
          finishButton && (
            <Stack.Toolbar.Button
              {...finishButton}
              disabled={saving}
              onPress={() => saveAndLeave(() => router.dismissAll())}
            />
          )
        }>
        <FieldGroup.Section>
          <SegmentedControl
            value={weekday}
            onChange={setWeekday}
            options={SCHOOL_WEEKDAYS.map((day) => ({ label: weekdayShort(day), value: day }))}
          />
        </FieldGroup.Section>

        <FieldGroup.Section
          title={t.school.timetableEditor.dayTitle({
            weekday: weekdayName(weekday),
            lessons: lessonCount,
          })}>
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
            <SecondaryText>{t.school.timetableEditor.footer}</SecondaryText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <ActionRow
            label={t.school.subjects.add}
            onPress={() => openScreen({ pathname: routes.subject, params: { id: "new" } })}
          />
        </FieldGroup.Section>
      </PushedForm>

      {/* Outside the form: inside it, the sheet would take up an empty row */}
      <SubjectPickerSheet
        isPresented={editing !== null}
        onDismiss={() => setEditing(null)}
        title={editedTitle}
        value={editedLesson?.subjectId ?? NONE}
        subjects={subjects}
        teachers={teachers}
        lessons={timetable}
        extraChoices={[{ label: t.school.timetableEditor.free, value: NONE }]}
        onChange={(subjectId) => {
          if (!editing || subjectId === (editedLesson?.subjectId ?? NONE)) return;
          if (subjectId === NONE) {
            setSlot(editing.id, null);
          } else {
            setSlot(editing.id, { subjectId, room: usualRoom(subjectId, timetable) });
          }
        }}
      />
    </>
  );
}
