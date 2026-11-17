import { FieldGroup } from "@expo/ui";
import { router } from "expo-router";
import { useState } from "react";

import { DateField } from "@/components/date-field";
import { DestructiveRow } from "@/components/rows";
import { SelectRow } from "@/components/select-row";
import { SheetForm } from "@/components/sheet-form";
import { useSubjectPicker } from "@/components/subject-picker";
import { TaskCheckbox } from "@/components/task-checkbox";
import { TextField } from "@/components/text-field";
import { deleteEntry, saveEntry } from "@/db/actions";
import { useTeachers } from "@/db/queries";
import type { Entry, EntryType, Lesson, Period, Subject } from "@/db/schema";
import { confirmDelete } from "@/lib/confirm-delete";
import { addDays, formatDate } from "@/lib/dates";
import { ENTRY_TYPE_INFO, ENTRY_TYPE_OPTIONS } from "@/lib/entry-types";
import { subjectLessonOn, upcomingSubjectLessons } from "@/lib/schedule";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { useNow } from "@/hooks/use-now";
import { useSaving } from "@/hooks/use-saving";

const NONE = 0;

type DueChoice = "next" | "afterNext" | "custom";

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
  // Set once the user picks the value, so it is no longer derived automatically
  dateTouched: boolean;
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
  const tomorrow = addDays(now.date, 1);
  const upcoming = (subjectId: number) =>
    upcomingSubjectLessons(subjectId, lessons, periods, 2, now);

  // Fills in the due date and period that follow from the other fields.
  const derive = (state: FormState): FormState => {
    const next = { ...state };

    if (next.type === "homework") {
      if (next.dueChoice !== "custom") {
        const [first, second] = upcoming(next.subjectId);
        const pick = next.dueChoice === "next" ? first : (second ?? first);
        next.date = pick?.date ?? tomorrow;
        next.periodId = pick?.period.id ?? NONE;
      }
    } else {
      if (!next.dateTouched) {
        // An exam is announced ahead, so it gets the first lesson from tomorrow on
        next.date =
          upcomingSubjectLessons(next.subjectId, lessons, periods, 1, {
            date: tomorrow,
            minutes: 0,
          })[0]?.date ?? tomorrow;
      }
      if (!next.periodTouched) {
        next.periodId =
          subjectLessonOn(next.subjectId, next.date, lessons, periods)?.period.id ?? NONE;
      }
    }
    return next;
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
          dateTouched: true,
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
          dateTouched: false,
          periodTouched: false,
        })
  );

  const change = (changes: Partial<FormState>) =>
    setForm((state) => derive({ ...state, ...changes }));
  // The texts do not affect the derived fields, so typing skips the schedule lookups
  const edit = (changes: Partial<Pick<FormState, "title" | "topic" | "description">>) =>
    setForm((state) => ({ ...state, ...changes }));

  const info = ENTRY_TYPE_INFO[form.type];
  const [nextLesson, lessonAfter] = upcoming(form.subjectId);
  const canSave = form.title.trim().length > 0;

  // The form as it was opened, to tell whether anything was changed
  const [initialForm] = useState(form);
  const dirty = (
    ["type", "title", "description", "subjectId", "date", "periodId", "completed", "topic"] as const
  ).some((field) => form[field] !== initialForm[field]);
  const allowLeave = useDiscardGuard(dirty);
  const { saving, run } = useSaving({ closesOnSuccess: true });

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
    run(async () => {
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
      allowLeave();
      router.back();
    });

  const remove = () => {
    if (!entry) return;
    confirmDelete(
      {
        title: "Eintrag löschen?",
        message: `«${entry.title}» wird gelöscht.`,
        onDelete: () => deleteEntry(entry.id),
      },
      allowLeave
    );
  };

  return (
    <>
      <SheetForm
        title={entry ? info.label : "Neuer Eintrag"}
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

        <FieldGroup.Section title="Termin">
          {form.type === "homework" && (
            <SelectRow
              label="Fällig"
              value={form.dueChoice}
              onChange={(dueChoice) => change({ dueChoice })}
              options={[
                {
                  label: nextLesson ? `Nächste Lektion (${formatDate(nextLesson.date)})` : "Morgen",
                  value: "next",
                },
                ...(lessonAfter
                  ? [
                      {
                        label: `Übernächste Lektion (${formatDate(lessonAfter.date)})`,
                        value: "afterNext" as const,
                      },
                    ]
                  : []),
                { label: "Datum wählen", value: "custom" },
              ]}
            />
          )}
          {(form.type !== "homework" || form.dueChoice === "custom") && (
            <DateField
              label="Datum"
              value={form.date}
              onChange={(date) => change({ date, dateTouched: true })}
            />
          )}
          {form.type !== "homework" && (
            <SelectRow
              label="Lektion"
              value={form.periodId}
              onChange={(periodId) => change({ periodId, periodTouched: true })}
              options={[
                { label: "Keine", value: NONE },
                ...periods.map((period, index) => ({
                  label: `${index + 1}. Lektion (${period.startTime})`,
                  value: period.id,
                })),
              ]}
            />
          )}
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
