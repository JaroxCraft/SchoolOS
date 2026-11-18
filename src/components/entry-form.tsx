import { FieldGroup } from "@expo/ui";
import { useMemo, useState } from "react";

import { DateField } from "@/components/date-field";
import { DestructiveRow } from "@/components/rows";
import { NONE, noneToNull } from "@/components/search-picker";
import { type SelectOption, SelectRow } from "@/components/select-row";
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
import { t } from "@/i18n";
import { entryDeletion } from "@/lib/confirm-delete";
import { formatDate } from "@/lib/dates";
import { type DueChoice, dueChoiceDates, type DueFields, suggestDue } from "@/lib/due-date";
import { ENTRY_TYPE_INFO, ENTRY_TYPE_OPTIONS, NO_SUBJECT_LABEL } from "@/lib/entry-types";
import { findById } from "@/lib/find";
import { periodLabel } from "@/lib/schedule";
import { NO_SUBJECT_COLOR } from "@/lib/subject-colors";

// The subject and period are NONE instead of null, as the pickers need a value
type FormState = Omit<DueFields, "subjectId" | "periodId"> & {
  type: EntryType;
  title: string;
  description: string;
  subjectId: number;
  periodId: number;
  completed: boolean;
  topic: string;
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

  const derive = (state: FormState): FormState => {
    const due = suggestDue(
      { ...state, subjectId: noneToNull(state.subjectId), periodId: noneToNull(state.periodId) },
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
          periodPickedByUser: true,
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
          periodPickedByUser: false,
        })
  );

  const change = (changes: Partial<FormState>) =>
    setForm((state) => derive({ ...state, ...changes }));
  // The texts do not affect the derived fields, so typing skips the schedule lookups; the
  // choice dates below are memoized for the same reason
  const edit = (changes: Partial<Pick<FormState, "title" | "topic" | "description">>) =>
    setForm((state) => ({ ...state, ...changes }));

  const info = ENTRY_TYPE_INFO[form.type];
  const subjectId = noneToNull(form.subjectId);
  const choiceDates = useMemo(
    () => dueChoiceDates(subjectId, lessons, periods, now),
    [subjectId, lessons, periods, now]
  );
  const [initialForm] = useState(form);
  const dirty = (
    ["type", "title", "description", "subjectId", "date", "periodId", "completed", "topic"] as const
  ).some((field) => form[field] !== initialForm[field]);
  const canSave = dirty && form.title.trim().length > 0;
  const { saving, saveAndClose, deleteAndClose } = useClosingForm(dirty);

  const dueOptions: SelectOption<DueChoice>[] = [
    {
      label: choiceDates.next
        ? t.entries.form.nextLesson(formatDate(choiceDates.next))
        : t.entries.form.tomorrow,
      value: "next",
    },
  ];
  if (choiceDates.afterNext) {
    dueOptions.push({
      label: t.entries.form.lessonAfterNext(formatDate(choiceDates.afterNext)),
      value: "afterNext",
    });
  }
  dueOptions.push({ label: t.entries.form.pickDate, value: "custom" });

  const subjectPicker = useSubjectPicker({
    label: t.entries.form.subject,
    value: form.subjectId,
    subjects,
    teachers: useTeachers(),
    lessons,
    extraChoices: [{ label: NO_SUBJECT_LABEL, value: NONE }],
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
        subjectId: noneToNull(form.subjectId),
        date: form.date,
        periodId: noneToNull(form.periodId),
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
        title={entry ? entry.title : t.entries.newEntry}
        canSave={canSave && !saving}
        dirty={dirty}
        onSave={save}>
        <FieldGroup.Section>
          <SelectRow
            label={t.entries.form.type}
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

        {/* The same for every type: a quick choice fills in date and period, changing either
            of them by hand makes it "Pick a date" */}
        <FieldGroup.Section title={t.entries.form.dueSection}>
          <SelectRow
            label={t.entries.form.due}
            value={form.dueChoice}
            onChange={(dueChoice) => change({ dueChoice, periodPickedByUser: false })}
            options={dueOptions}
          />
          <DateField
            label={t.entries.form.date}
            value={form.date}
            onChange={(date) => change({ date, dueChoice: "custom" })}
          />
          <SelectRow
            label={t.entries.form.period}
            value={form.periodId}
            onChange={(periodId) =>
              change({ periodId, periodPickedByUser: true, dueChoice: "custom" })
            }
            options={[
              { label: t.entries.form.noPeriod, value: NONE },
              ...periods.map((period, index) => ({
                label: t.entries.form.periodOption({
                  period: periodLabel(index + 1),
                  time: period.startTime,
                }),
                value: period.id,
              })),
            ]}
          />
          {entry && (
            <TaskCheckbox
              label={t.entries.done}
              value={form.completed}
              color={findById(subjects, form.subjectId)?.color ?? NO_SUBJECT_COLOR}
              onValueChange={(completed) => change({ completed })}
            />
          )}
        </FieldGroup.Section>

        {info.gradable && (
          <FieldGroup.Section title={t.entries.form.preparationSection}>
            <TextField
              placeholder={t.entries.form.topicPlaceholder}
              defaultValue={form.topic}
              multiline
              onChangeText={(topic) => edit({ topic })}
            />
          </FieldGroup.Section>
        )}

        <FieldGroup.Section title={t.entries.form.notesSection}>
          <TextField
            placeholder={t.entries.form.descriptionPlaceholder}
            defaultValue={form.description}
            multiline
            onChangeText={(description) => edit({ description })}
          />
        </FieldGroup.Section>

        {entry && (
          <FieldGroup.Section>
            <DestructiveRow label={t.entries.form.delete} onPress={remove} />
          </FieldGroup.Section>
        )}
      </SheetForm>
      {subjectPicker.sheet}
    </>
  );
}
