import { FieldGroup } from "@expo/ui";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { EntryRow } from "@/components/entry-row";
import { FormList } from "@/components/form-list";
import { Screen } from "@/components/screen";
import { SelectRow } from "@/components/select-row";
import { useEntries, useSubjects } from "@/db/queries";
import type { Entry, EntryType } from "@/db/schema";
import { today } from "@/lib/dates";
import { ENTRY_TYPE_OPTIONS, isCheckable } from "@/lib/entry-types";

const ALL = "all";
const ALL_SUBJECTS = 0;
const GENERAL = -1;

export default function AgendaScreen() {
  const subjects = useSubjects();
  const entries = useEntries();
  const [typeFilter, setTypeFilter] = useState<EntryType | typeof ALL>(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL_SUBJECTS);

  const subjectById = (id: number | null) => subjects.find((subject) => subject.id === id);

  if (entries.length === 0) {
    return (
      <Screen title="Agenda" showAddButton>
        <EmptyState
          title="Keine Termine"
          message="Hausaufgaben, Prüfungen, Präsentationen und Abgaben erscheinen hier. Tippe auf +, um einen Eintrag zu erfassen."
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

  const isDone = (entry: Entry) => isCheckable(entry.type) && entry.completed;
  // Open homework and submissions stay upcoming even when overdue
  const isPast = (entry: Entry) => !isCheckable(entry.type) && entry.date < today();

  const upcoming = visible.filter((entry) => !isDone(entry) && !isPast(entry));
  const done = visible.filter(isDone).reverse();
  const past = visible.filter(isPast).reverse();

  const sections = [
    { title: "Anstehend", items: upcoming },
    { title: "Erledigt", items: done },
    { title: "Vergangen", items: past },
  ];

  return (
    <Screen title="Agenda" showAddButton>
      <FormList>
        <FieldGroup.Section title="Filter">
          <SelectRow
            label="Typ"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ label: "Alle", value: ALL }, ...ENTRY_TYPE_OPTIONS]}
          />
          <SelectRow
            label="Fach"
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={[
              { label: "Alle", value: ALL_SUBJECTS },
              { label: "Allgemein", value: GENERAL },
              ...subjects.map((subject) => ({ label: subject.name, value: subject.id })),
            ]}
          />
        </FieldGroup.Section>

        {sections
          .filter((section) => section.items.length > 0)
          .map((section) => (
            <FieldGroup.Section key={section.title} title={section.title}>
              {section.items.map((entry) => (
                <EntryRow key={entry.id} entry={entry} subject={subjectById(entry.subjectId)} />
              ))}
            </FieldGroup.Section>
          ))}
      </FormList>
    </Screen>
  );
}
