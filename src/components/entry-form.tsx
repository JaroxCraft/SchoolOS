import { FieldGroup } from "@expo/ui";
import { useState } from "react";

import { DateField } from "@/components/date-field";
import { DestructiveRow } from "@/components/rows";
import { NONE } from "@/components/search-picker";
import { SelectRow } from "@/components/select-row";
import { SheetForm } from "@/components/sheet-form";
import { useSubjectPicker } from "@/components/subject-picker";
import { TaskCheckbox } from "@/components/task-checkbox";
import { TextField } from "@/components/text-field";
import { saveEntry } from "@/db/actions";
import { useTeachers } from "@/db/queries";
import type { Entry, EntryType, Lesson, Period, Subject } from "@/db/schema";
import { useClosingForm } from "@/hooks/use-closing-form";
import { checkOffEntry } from "@/hooks/use-entry-placement";
import { useNow } from "@/hooks/use-now";
import { entryDeletion } from "@/lib/confirm-delete";
import { formatDate } from "@/lib/dates";
import { type DueChoice, dueChoiceDates, suggestDue } from "@/lib/due-date";
import { ENTRY_TYPE_INFO, ENTRY_TYPE_OPTIONS } from "@/lib/entry-types";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";

type FormState = {
  type: EntryType;
  title: string;
  description: string;
  subjectId: number;
  date: string;
  periodId: number;
  dueChoice: DueChoice;
  completed: boolean;
  topic: string;
  // Set once the user picks the Lektion of a chosen date, so it is no longer suggested
  periodTouched: boolean;
};

type EntryFormProps = {
  entry: Entry | undefined;
  initialSubjectId: number | null;
  subjects: Subject[];
  periods: Period[];
  lessons: Lesson[];
};

export function EntryForm({ entry, initialSubjectId, subjects, periods, lessons }: EntryFormProps) {
  const now = useNow();
  const orNull = (id: number) => (id === NONE ? null : id);

  // Fills in the due date and period that follow from the other fields.
  const derive = (state: FormState): FormState => {
    const due = suggestDue(
      { ...state, subjectId: orNull(state.subjectId), periodId: orNull(state.periodId) },
      lessons,
      periods,
      now
    );
    return { ...state, date: due.date, periodId: due.periodId ?? NONE };
  };

  const [form, setForm] = useState<FormState>(() =>
    entry
      ? {
          type: entry.type,
          title: entry.title,
          description: entry.description ?? "",
          subjectId: entry.subjectId ?? NONE,
          date: entry.date,
          periodId: entry.periodId ?? NONE,
          dueChoice: "custom",
          completed: entry.completed,
          topic: entry.topic ?? "",
          periodTouched: true,
        }
      : derive({
          type: "homework",
          title: "",
          description: "",
          subjectId: initialSubjectId ?? NONE,
          date: now.date,
          periodId: NONE,
          dueChoice: "next",
          completed: false,
          topic: "",
          periodTouched: false,
        })
  );

  const change = (changes: Partial<FormState>) =>
    setForm((state) => derive({ ...state, ...changes }));
  // The texts do not affect the derived fields, so typing skips the schedule lookups
  const edit = (changes: Partial<Pick<FormState, "title" | "topic" | "description">>) =>
    setForm((state) => ({ ...state, ...changes }));

  const info = ENTRY_TYPE_INFO[form.type];
  const choiceDates = dueChoiceDates(orNull(form.subjectId), lessons, periods, now);
  // The form as it was opened, to tell whether anything was changed
  const [initialForm] = useState(form);
  const dirty = (
    ["type", "title", "description", "subjectId", "date", "periodId", "completed", "topic"] as const
  ).some((field) => form[field] !== initialForm[field]);
  // ✓ only while there is something to save
  const canSave = dirty && form.title.trim().length > 0;
  const { saving, saveAndClose, deleteAndClose } = useClosingForm(dirty);

  const subjectPicker = useSubjectPicker({
    label: "Fach",
    value: form.subjectId,
    subjects,
    teachers: useTeachers(),
    lessons,
    extraChoices: [{ label: "Allgemein", value: NONE }],
    onChange: (subjectId) => change({ subjectId }),
  });

  const save = () =>
    saveAndClose(async () => {
      // Checked off or reopened here, it moves in the list beneath once the sheet has closed,
      // animated like from a row
      if (entry && form.completed !== entry.completed) {
        await checkOffEntry(entry, form.completed);
      }
      await saveEntry(entry?.id ?? null, {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        subjectId: form.subjectId === NONE ? null : form.subjectId,
        date: form.date,
        periodId: form.periodId === NONE ? null : form.periodId,
        completed: form.completed,
        topic: info.gradable ? form.topic.trim() || null : null,
      });
    });

  const remove = () => {
    if (entry) deleteAndClose(entryDeletion(entry));
  };

  return (
    <>
      <SheetForm
        title={entry ? entry.title : "Neuer Eintrag"}
        canSave={canSave && !saving}
        dirty={dirty}
        onSave={save}>
        <FieldGroup.Section>
          <SelectRow
            label="Typ"
            value={form.type}
            onChange={(type) => change({ type })}
            options={ENTRY_TYPE_OPTIONS}
          />
          <TextField
            placeholder={info.titlePlaceholder}
            defaultValue={form.title}
            autoFocus={!entry}
            onChangeText={(title) => edit({ title })}
          />
          {subjectPicker.row}
        </FieldGroup.Section>

        {/* The same for every type: a quick choice fills in date and Lektion, changing either
            of them by hand makes it "Datum wählen" */}
        <FieldGroup.Section title="Termin">
          <SelectRow
            label="Wann"
            value={form.dueChoice}
            onChange={(dueChoice) => change({ dueChoice, periodTouched: false })}
            options={[
              {
                label: choiceDates.next
                  ? `Nächste Lektion (${formatDate(choiceDates.next)})`
                  : "Morgen",
                value: "next",
              },
              ...(choiceDates.afterNext
                ? [
                    {
                      label: `Übernächste Lektion (${formatDate(choiceDates.afterNext)})`,
                      value: "afterNext" as const,
                    },
                  ]
                : []),
              { label: "Datum wählen", value: "custom" },
            ]}
          />
          <DateField
            label="Datum"
            value={form.date}
            onChange={(date) => change({ date, dueChoice: "custom" })}
          />
          <SelectRow
            label="Lektion"
            value={form.periodId}
            onChange={(periodId) => change({ periodId, periodTouched: true, dueChoice: "custom" })}
            options={[
              { label: "Keine", value: NONE },
              ...periods.map((period, index) => ({
                label: `${index + 1}. Lektion (${period.startTime})`,
                value: period.id,
              })),
            ]}
          />
          {entry && (
            <TaskCheckbox
              label="Erledigt"
              value={form.completed}
              color={
                subjects.find((subject) => subject.id === form.subjectId)?.color ?? NEUTRAL_COLOR
              }
              onValueChange={(completed) => change({ completed })}
            />
          )}
        </FieldGroup.Section>

        {info.gradable && (
          <FieldGroup.Section title="Vorbereitung">
            <TextField
              placeholder="Stoff"
              defaultValue={form.topic}
              multiline
              onChangeText={(topic) => edit({ topic })}
            />
          </FieldGroup.Section>
        )}

        <FieldGroup.Section title="Notizen">
          <TextField
            placeholder="Beschreibung"
            defaultValue={form.description}
            multiline
            onChangeText={(description) => edit({ description })}
          />
        </FieldGroup.Section>

        {entry && (
          <FieldGroup.Section>
            <DestructiveRow label="Eintrag löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </SheetForm>
      {subjectPicker.sheet}
    </>
  );
}
