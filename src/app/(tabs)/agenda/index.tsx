import { FieldGroup, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { EntryRow } from "@/components/entry-row";
import { FormList, rowsKey } from "@/components/form-list";
import { ActionRow } from "@/components/rows";
import { Screen } from "@/components/screen";
import { NONE } from "@/components/search-picker";
import { type SelectOption, SelectRow } from "@/components/select-row";
import { sortSubjectsByUse, useSubjectPicker } from "@/components/subject-picker";
import { useEntries, useLessons, useSubjects, useTeachers } from "@/db/queries";
import type { Entry, EntryType } from "@/db/schema";
import { useEntryPlacement } from "@/hooks/use-entry-placement";
import { useInk } from "@/hooks/use-ink";
import { useNow } from "@/hooks/use-now";
import { t } from "@/i18n";
import { ENTRY_TYPE_OPTIONS, NO_SUBJECT_LABEL } from "@/lib/entry-types";
import { findById } from "@/lib/find";
import { openEntry } from "@/lib/routes";

const ALL = "all";
// "All subjects"; NONE instead filters the entries without a subject (shown as "General")
const ALL_SUBJECTS = -1;

export default function AgendaScreen() {
  const subjects = useSubjects();
  const entries = useEntries();
  const lessons = useLessons();
  const [typeFilter, setTypeFilter] = useState<EntryType | typeof ALL>(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL_SUBJECTS);
  if (subjectFilter > 0 && !subjects.some((subject) => subject.id === subjectFilter)) {
    setSubjectFilter(ALL_SUBJECTS);
  }
  const placeEntries = useEntryPlacement();
  const ink = useInk();
  const now = useNow();

  const typeOptions: SelectOption<EntryType | typeof ALL>[] = [
    { label: Platform.OS === "ios" ? t.entries.agenda.allTypes : t.entries.agenda.all, value: ALL },
    ...ENTRY_TYPE_OPTIONS,
  ];
  const subjectChoices = [
    {
      label: Platform.OS === "ios" ? t.entries.agenda.allSubjects : t.entries.agenda.all,
      value: ALL_SUBJECTS,
    },
    { label: NO_SUBJECT_LABEL, value: NONE },
  ];
  const subjectPicker = useSubjectPicker({
    label: t.entries.agenda.subject,
    value: subjectFilter,
    subjects,
    teachers: useTeachers(),
    lessons,
    extraChoices: subjectChoices,
    onChange: setSubjectFilter,
  });

  if (entries.length === 0) {
    return (
      <Screen title={t.common.tabs.agenda} showAddButton>
        <EmptyState
          icon={{ ios: "checklist", android: "checklist" }}
          title={t.entries.agenda.empty.title}
          message={t.entries.agenda.empty.message}
          action={{ label: t.entries.add, onPress: () => openEntry({ id: "new" }) }}
        />
      </Screen>
    );
  }

  const matchesSubject = (entry: Entry) => {
    if (subjectFilter === ALL_SUBJECTS) return true;
    if (subjectFilter === NONE) return entry.subjectId === null;
    return entry.subjectId === subjectFilter;
  };
  const visible = entries.filter(
    (entry) => (typeFilter === ALL || entry.type === typeFilter) && matchesSubject(entry)
  );

  const { open, done } = placeEntries(visible);

  const sections = [
    { title: t.entries.open, items: open },
    { title: t.entries.done, items: done },
  ];

  const subjectOptions = [
    ...subjectChoices,
    ...sortSubjectsByUse(subjects, lessons).map((subject) => ({
      label: subject.name,
      value: subject.id,
    })),
  ];
  const filtered = typeFilter !== ALL || subjectFilter !== ALL_SUBJECTS;
  const filterLabel = t.entries.agenda.filterSummary(
    [
      typeFilter !== ALL && typeOptions.find((option) => option.value === typeFilter)?.label,
      subjectFilter !== ALL_SUBJECTS &&
        subjectOptions.find((option) => option.value === subjectFilter)?.label,
    ].filter((part): part is string => Boolean(part))
  );
  const resetFilter = () => {
    setTypeFilter(ALL);
    setSubjectFilter(ALL_SUBJECTS);
  };

  const filterMenu = Platform.OS === "ios" && (
    <Stack.Toolbar.Menu
      icon={
        filtered ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
      }
      accessibilityLabel={t.entries.agenda.filter}>
      <Stack.Toolbar.Menu inline title={t.entries.agenda.type}>
        {typeOptions.map((option) => (
          <Stack.Toolbar.MenuAction
            key={option.value}
            isOn={typeFilter === option.value}
            onPress={() => setTypeFilter(option.value)}>
            {option.label}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.Menu title={t.entries.agenda.subject} icon="books.vertical">
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
    <Screen title={t.common.tabs.agenda} showAddButton toolbarItems={filterMenu}>
      <FormList floatingButton rowsKey={rowsKey(open, done)}>
        {Platform.OS === "android" && (
          <FieldGroup.Section title={t.entries.agenda.filter}>
            <SelectRow
              label={t.entries.agenda.type}
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
            />
            {subjectPicker.row}
          </FieldGroup.Section>
        )}

        {Platform.OS === "ios" && filtered && visible.length > 0 && (
          <FieldGroup.Section title={t.entries.agenda.filtered(filterLabel)}>
            <ActionRow label={t.entries.agenda.resetFilter} onPress={resetFilter} />
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
                  subject={findById(subjects, entry.subjectId)}
                  today={now.date}
                />
              ))}
            </FieldGroup.Section>
          ))}

        {visible.length === 0 && (
          <FieldGroup.Section>
            <Text textStyle={{ color: ink.secondary }}>
              {t.entries.agenda.noMatches(filterLabel)}
            </Text>
            <ActionRow label={t.entries.agenda.resetFilter} onPress={resetFilter} />
          </FieldGroup.Section>
        )}
      </FormList>
      {Platform.OS === "android" && subjectPicker.sheet}
    </Screen>
  );
}
