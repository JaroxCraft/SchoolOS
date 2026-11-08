import { FieldGroup, Text } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { EntryRow } from "@/components/entry-row";
import { FormList } from "@/components/form-list";
import { ActionRow } from "@/components/rows";
import { Screen } from "@/components/screen";
import { type SelectOption, SelectRow } from "@/components/select-row";
import { sortSubjectsByUse, useSubjectPicker } from "@/components/subject-picker";
import { useEntries, useLessons, useSubjects, useTeachers } from "@/db/queries";
import type { Entry, EntryType } from "@/db/schema";
import { useInk } from "@/hooks/use-ink";
import { useNow } from "@/hooks/use-now";
import { useWasCompleted } from "@/hooks/use-recently-completed";
import { ENTRY_TYPE_OPTIONS, isCheckable } from "@/lib/entry-types";
import { NEW_ENTRY } from "@/lib/routes";

const ALL = "all";
const ALL_SUBJECTS = 0;
const GENERAL = -1;

export default function AgendaScreen() {
  const subjects = useSubjects();
  const entries = useEntries();
  const lessons = useLessons();
  const [typeFilter, setTypeFilter] = useState<EntryType | typeof ALL>(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL_SUBJECTS);
  // The filtered subject was deleted: show all subjects again, as if no filter was set
  if (subjectFilter > 0 && !subjects.some((subject) => subject.id === subjectFilter)) {
    setSubjectFilter(ALL_SUBJECTS);
  }
  const wasCompleted = useWasCompleted();
  const ink = useInk();
  const now = useNow();

  // The choices above the types and subjects, used by the iOS menu and the Android rows alike.
  // iOS names what "Alle" covers, since its menu lists types and subjects together; the Android
  // rows already say "Typ" and "Fach".
  const typeOptions: SelectOption<EntryType | typeof ALL>[] = [
    { label: Platform.OS === "ios" ? "Alle Typen" : "Alle", value: ALL },
    ...ENTRY_TYPE_OPTIONS,
  ];
  const subjectChoices = [
    { label: Platform.OS === "ios" ? "Alle Fächer" : "Alle", value: ALL_SUBJECTS },
    { label: "Allgemein", value: GENERAL },
  ];
  const subjectPicker = useSubjectPicker({
    label: "Fach",
    value: subjectFilter,
    subjects,
    teachers: useTeachers(),
    lessons,
    extraChoices: subjectChoices,
    onChange: setSubjectFilter,
  });

  const subjectById = (id: number | null) => subjects.find((subject) => subject.id === id);

  if (entries.length === 0) {
    return (
      <Screen title="Agenda" showAddButton>
        <EmptyState
          icon={{ ios: "checklist", android: "checklist" }}
          title="Keine Termine"
          message="Hausaufgaben, Prüfungen, Präsentationen und Abgaben erscheinen hier."
          action={{ label: "Eintrag erfassen", onPress: () => router.push(NEW_ENTRY) }}
        />
      </Screen>
    );
  }

  const visible = entries.filter(
    (entry) =>
      (typeFilter === ALL || entry.type === typeFilter) &&
      (subjectFilter === ALL_SUBJECTS ||
        (subjectFilter === GENERAL ? entry.subjectId === null : entry.subjectId === subjectFilter))
  );

  // Tasks (un)checked just now stay in their section until the screen is left
  const isDone = (entry: Entry) => isCheckable(entry.type) && wasCompleted(entry);
  // Open homework and submissions stay upcoming even when overdue
  const isPast = (entry: Entry) => !isCheckable(entry.type) && entry.date < now.date;

  const upcoming = visible.filter((entry) => !isDone(entry) && !isPast(entry));
  const done = visible.filter(isDone).reverse();
  const past = visible.filter(isPast).reverse();

  const sections = [
    { title: "Anstehend", items: upcoming },
    { title: "Erledigt", items: done },
    { title: "Vergangen", items: past },
  ];

  const subjectOptions = [
    ...subjectChoices,
    ...sortSubjectsByUse(subjects, lessons).map((subject) => ({
      label: subject.name,
      value: subject.id,
    })),
  ];
  const filtered = typeFilter !== ALL || subjectFilter !== ALL_SUBJECTS;
  const filterLabel = [
    typeFilter !== ALL && typeOptions.find((option) => option.value === typeFilter)?.label,
    subjectFilter !== ALL_SUBJECTS &&
      subjectOptions.find((option) => option.value === subjectFilter)?.label,
  ]
    .filter(Boolean)
    .join(" · ");
  const resetFilter = () => {
    setTypeFilter(ALL);
    setSubjectFilter(ALL_SUBJECTS);
  };

  // iOS: the filter is a menu in the navigation bar, like in Mail; its icon is filled while a
  // filter is on. Android keeps the filter rows at the top of the list.
  const filterMenu = Platform.OS === "ios" && (
    <Stack.Toolbar.Menu
      icon={
        filtered ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
      }
      accessibilityLabel="Filter">
      <Stack.Toolbar.Menu inline title="Typ">
        {typeOptions.map((option) => (
          <Stack.Toolbar.MenuAction
            key={option.value}
            isOn={typeFilter === option.value}
            onPress={() => setTypeFilter(option.value)}>
            {option.label}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.Menu title="Fach" icon="books.vertical">
        {subjectOptions.map((option) => (
          <Stack.Toolbar.MenuAction
            key={option.value}
            isOn={subjectFilter === option.value}
            onPress={() => setSubjectFilter(option.value)}>
            {option.label}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar.Menu>
  );

  return (
    <Screen title="Agenda" showAddButton toolbarItems={filterMenu}>
      <FormList floatingButton>
        {Platform.OS === "android" && (
          <FieldGroup.Section title="Filter">
            <SelectRow
              label="Typ"
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
            />
            {subjectPicker.row}
          </FieldGroup.Section>
        )}

        {/* iOS: what the menu filters by, and the way back to all entries */}
        {Platform.OS === "ios" && filtered && visible.length > 0 && (
          <FieldGroup.Section title={`Gefiltert: ${filterLabel}`}>
            <ActionRow label="Alle Einträge zeigen" onPress={resetFilter} />
          </FieldGroup.Section>
        )}

        {sections
          .filter((section) => section.items.length > 0)
          .map((section) => (
            <FieldGroup.Section key={section.title} title={section.title}>
              {section.items.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  subject={subjectById(entry.subjectId)}
                  today={now.date}
                />
              ))}
            </FieldGroup.Section>
          ))}

        {visible.length === 0 && (
          <FieldGroup.Section>
            <Text textStyle={{ color: ink.secondary }}>
              {filterLabel
                ? `Keine Einträge für «${filterLabel}»`
                : "Keine Einträge für diesen Filter"}
            </Text>
            <ActionRow label="Filter zurücksetzen" onPress={resetFilter} />
          </FieldGroup.Section>
        )}
      </FormList>
      {subjectPicker.sheet}
    </Screen>
  );
}
