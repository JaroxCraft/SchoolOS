import { Column, FieldGroup, ListItem, Row, Text } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { FooterText, FormList } from "@/components/form-list";
import { ActionRow } from "@/components/rows";
import { SegmentedControl } from "@/components/segmented-control";
import { SubjectDot } from "@/components/subject-dot";
import { SubjectPickerSheet } from "@/components/subject-picker";
import { TextField } from "@/components/text-field";
import { setLesson, setLessonRoom } from "@/db/actions";
import { useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import type { Lesson, Period, Subject } from "@/db/schema";
import { type Ink, useInk } from "@/hooks/use-ink";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayName, weekdayShort } from "@/lib/dates";
import { endEditing } from "@/lib/focused-fields";
import { lessonAt, periodNumber, periodRange } from "@/lib/schedule";

const FREE = 0;

type LessonRowsProps = {
  period: Period;
  number: number;
  lesson: Lesson | undefined;
  subject: Subject | undefined;
  onPress: () => void;
  ink: Ink;
};

// One row per period with its time and the subject (color dot and name) on the right. A period
// with a subject gets a "Zimmer" field: on iOS as a row right below it (rows of a section are
// joined), on Android inside the lesson's own card, since Android draws every row as a card of its
// own. Returned as an array, not a component: the Android section only recognizes its rows (and
// draws a list item as a row of its own) when they are its direct children.
function lessonRows({ period, number, lesson, subject, onPress, ink }: LessonRowsProps) {
  const roomField = lesson && subject && (
    <Row key={`room-${lesson.id}`} alignment="center" spacing={12}>
      <Text textStyle={{ color: ink.secondary }}>Zimmer</Text>
      <TextField
        // A new lesson (another subject) gets a fresh field with its room
        key={lesson.id}
        placeholder={`Zimmer für ${subject.abbreviation}`}
        defaultValue={lesson.room ?? ""}
        // Android: right after the label, since the field's width depends on the subject's name
        textAlign={Platform.OS === "android" ? "left" : "right"}
        // The room is saved while typing; the key only ends the editing
        returnKeyType="done"
        onSubmitEditing={endEditing}
        autoCorrect={false}
        onChangeText={(room) => setLessonRoom(lesson.id, room.trim() || null)}
      />
    </Row>
  );

  return [
    <ListItem
      key={`lesson-${period.id}`}
      onPress={onPress}
      supportingText={
        Platform.OS === "android" && roomField ? (
          <Column spacing={4}>
            <Text textStyle={{ color: ink.secondary, fontSize: 14 }}>{periodRange(period)}</Text>
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
    </ListItem>,
    Platform.OS === "ios" && roomField,
  ];
}

// The room a subject usually has, to fill in when it is put into another period
function usualRoom(subjectId: number, lessons: Lesson[]): string | null {
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    if (lesson.subjectId === subjectId && lesson.room) {
      counts.set(lesson.room, (counts.get(lesson.room) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// The timetable of one weekday at a time, one row per period. Tapping a period opens the subject
// sheet, which stays open so the room can be entered right after. Changes are saved immediately.
export default function TimetableSettingsScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();
  const teachers = useTeachers();
  const ink = useInk();
  // Start on the current weekday, or on Monday at the weekend
  const [weekday, setWeekday] = useState(() => {
    const current = isoWeekday(today());
    return current <= 5 ? current : 1;
  });
  // The period whose sheet is open
  const [editing, setEditing] = useState<Period | null>(null);

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
            onPress: () => router.replace(noPeriods ? "/settings/periods" : "/settings/subjects"),
          }}
        />
      </>
    );
  }

  const subjectOf = (lesson: Lesson | undefined) =>
    subjects.find((subject) => subject.id === lesson?.subjectId);
  const lessonCount = lessons.filter((lesson) => lesson.weekday === weekday).length;
  const editedLesson = editing ? lessonAt(lessons, weekday, editing.id) : undefined;
  const editedTitle = editing
    ? `${weekdayName(weekday)}, ${periodNumber(periods, editing.id)}. Lektion`
    : "";

  return (
    <>
      <Stack.Title>Stundenplan</Stack.Title>
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
            const lesson = lessonAt(lessons, weekday, period.id);
            return lessonRows({
              period,
              number: index + 1,
              lesson,
              subject: subjectOf(lesson),
              onPress: () => setEditing(period),
              ink,
            });
          })}
          <FieldGroup.SectionFooter>
            <FooterText>
              Tippe auf eine Lektion, um das Fach zu wählen. Das Zimmer wird vom Fach übernommen und
              lässt sich darunter ändern. Änderungen werden sofort gespeichert.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <ActionRow label="Fach hinzufügen" onPress={() => router.push("/settings/subject/new")} />
        </FieldGroup.Section>
      </FormList>

      {/* Outside the form: inside it, the sheet would take up an empty row */}
      <SubjectPickerSheet
        isPresented={editing !== null}
        onDismiss={() => setEditing(null)}
        title={editedTitle}
        value={editedLesson?.subjectId ?? FREE}
        subjects={subjects}
        teachers={teachers}
        lessons={lessons}
        extraChoices={[{ label: "Frei", value: FREE }]}
        onChange={(subjectId) => {
          if (!editing) return;
          setLesson(
            weekday,
            editing.id,
            subjectId === FREE ? null : subjectId,
            // The room the subject usually has; it can be changed in the row below the lesson
            subjectId === FREE ? null : usualRoom(subjectId, lessons)
          );
        }}
      />
    </>
  );
}
