import { BottomSheet, FieldGroup, Icon, ListItem, Row, Text, TextInput } from "@expo/ui";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform } from "react-native";

import { SubjectDot } from "@/components/subject-dot";
import type { Lesson, Subject, Teacher } from "@/db/schema";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { joinDetails } from "@/lib/text";

// Choices above the subjects, e.g. "Frei" in the timetable or "Allgemein" for entries
export type ExtraChoice = { label: string; value: number };

// The subjects with the most lessons first (the ones picked most often), then by name.
export function sortSubjectsByUse(subjects: Subject[], lessons: Lesson[]): Subject[] {
  const counts = new Map<number, number>();
  for (const lesson of lessons) {
    counts.set(lesson.subjectId, (counts.get(lesson.subjectId) ?? 0) + 1);
  }
  return [...subjects].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name)
  );
}

function Checkmark() {
  const ink = useInk();
  const name = useSymbol("checkmark", "check");
  if (!name) return null;
  // The accent color marks the selection, like a checked row in the iOS settings
  return <Icon name={name} size={17} color={ink.accent} />;
}

function SearchField({ onChange }: { onChange: (query: string) => void }) {
  const ink = useInk();
  const icon = useSymbol("magnifyingglass", "search");

  return (
    <Row alignment="center" spacing={8}>
      {icon && <Icon name={icon} size={17} color={ink.secondary} />}
      <TextInput
        placeholder="Fach oder Lehrperson suchen"
        placeholderTextColor={Platform.OS === "android" ? ink.tertiary : undefined}
        autoCorrect={false}
        returnKeyType="search"
        onChangeText={onChange}
      />
    </Row>
  );
}

type SubjectPickerSheetProps = {
  isPresented: boolean;
  onDismiss: () => void;
  title: string;
  value: number;
  subjects: Subject[];
  teachers: Teacher[];
  lessons: Lesson[];
  extraChoices: ExtraChoice[];
  onChange: (value: number) => void;
};

// A large sheet with a search field (subject name, abbreviation or teacher) and all subjects as
// a list with color, abbreviation and teacher, the most used first. Picking one closes it.
export function SubjectPickerSheet({
  isPresented,
  onDismiss,
  title,
  value,
  subjects,
  teachers,
  lessons,
  extraChoices,
  onChange,
}: SubjectPickerSheetProps) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const teacherOf = (subject: Subject) =>
    teachers.find((teacher) => teacher.id === subject.teacherId);
  const matches = sortSubjectsByUse(subjects, lessons).filter((subject) => {
    if (!search) return true;
    const teacher = teacherOf(subject);
    return [subject.name, subject.abbreviation, teacher?.name, teacher?.abbreviation].some((text) =>
      text?.toLowerCase().includes(search)
    );
  });

  const close = () => {
    setQuery("");
    onDismiss();
  };

  const choose = (next: number) => {
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
    close();
  };

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={close}
      snapPoints={["full"]}
      contentPadding={0}>
      <FieldGroup>
        <FieldGroup.Section title={title}>
          <SearchField onChange={setQuery} />
        </FieldGroup.Section>
        {!search && (
          <FieldGroup.Section>
            {extraChoices.map((choice) => (
              <ListItem
                key={choice.value}
                onPress={() => choose(choice.value)}
                leading={<SubjectDot color={NEUTRAL_COLOR} />}
                trailing={choice.value === value ? <Checkmark /> : undefined}>
                {choice.label}
              </ListItem>
            ))}
          </FieldGroup.Section>
        )}
        <FieldGroup.Section title="Fächer">
          {matches.length === 0 && <Text>{`Nichts gefunden für «${query.trim()}»`}</Text>}
          {matches.map((subject) => (
            <ListItem
              key={subject.id}
              onPress={() => choose(subject.id)}
              leading={<SubjectDot color={subject.color} />}
              supportingText={joinDetails(subject.abbreviation, teacherOf(subject)?.name)}
              trailing={subject.id === value ? <Checkmark /> : undefined}>
              {subject.name}
            </ListItem>
          ))}
        </FieldGroup.Section>
      </FieldGroup>
    </BottomSheet>
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
  const selected = props.subjects.find((subject) => subject.id === props.value);
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
