import { ListItem, Row, Text } from "@expo/ui";
import { useState } from "react";

import type { ExtraChoice } from "@/components/search-picker";
import { SearchPickerSheet } from "@/components/search-picker-sheet";
import { SubjectDot } from "@/components/subject-dot";
import type { LessonSlot, Subject, Teacher } from "@/db/schema";
import { useInk } from "@/hooks/use-ink";
import { findById } from "@/lib/find";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { joinDetails } from "@/lib/text";

// The subjects with the most lessons first (the ones picked most often), then by name.
export function sortSubjectsByUse(subjects: Subject[], lessons: LessonSlot[]): Subject[] {
  const counts = new Map<number, number>();
  for (const lesson of lessons) {
    counts.set(lesson.subjectId, (counts.get(lesson.subjectId) ?? 0) + 1);
  }
  return [...subjects].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name)
  );
}

type SubjectPickerSheetProps = {
  isPresented: boolean;
  onDismiss: () => void;
  title: string;
  value: number;
  subjects: Subject[];
  teachers: Teacher[];
  lessons: LessonSlot[];
  extraChoices: ExtraChoice[];
  onChange: (value: number) => void;
};

// The subjects with color, abbreviation and teacher, the most used first, searchable by subject
// name, abbreviation or teacher. Picking one closes the sheet.
export function SubjectPickerSheet({
  subjects,
  teachers,
  lessons,
  ...props
}: SubjectPickerSheetProps) {
  const teacherOf = (subject: Subject) => findById(teachers, subject.teacherId);

  return (
    <SearchPickerSheet
      {...props}
      searchPlaceholder="Fach oder Lehrperson suchen"
      items={sortSubjectsByUse(subjects, lessons)}
      itemsTitle="Fächer"
      getLabel={(subject) => subject.name}
      getSearchText={(subject) => [
        subject.name,
        subject.abbreviation,
        teacherOf(subject)?.name,
        teacherOf(subject)?.abbreviation,
      ]}
      renderLeading={(subject) => <SubjectDot color={subject.color} />}
      getSupportingText={(subject) => joinDetails(subject.abbreviation, teacherOf(subject)?.name)}
      extraLeading={<SubjectDot color={NEUTRAL_COLOR} />}
    />
  );
}

type SubjectPickerOptions = Omit<SubjectPickerSheetProps, "isPresented" | "onDismiss" | "title"> & {
  label: string;
};

// A form row showing the chosen subject with its color, and the sheet it opens. Place `row` in
// the form and `sheet` outside of it (after <FormList>): inside a SwiftUI form the sheet would
// take up an empty row of its own.
export function useSubjectPicker({ label, ...props }: SubjectPickerOptions) {
  const ink = useInk();
  const [open, setOpen] = useState(false);
  const selected = findById(props.subjects, props.value);
  const selectedLabel =
    selected?.name ?? props.extraChoices.find((choice) => choice.value === props.value)?.label;

  // A direct list item of the section: Android draws it as the row with the section background
  const row = (
    <ListItem
      onPress={() => setOpen(true)}
      trailing={
        <Row spacing={8} alignment="center">
          {selected && <SubjectDot color={selected.color} />}
          <Text textStyle={{ color: ink.secondary }}>{selectedLabel ?? ""}</Text>
        </Row>
      }>
      {label}
    </ListItem>
  );

  const sheet = (
    <SubjectPickerSheet
      {...props}
      title={label}
      isPresented={open}
      onDismiss={() => setOpen(false)}
    />
  );

  return { row, sheet };
}
