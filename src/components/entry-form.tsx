import { FieldGroup, TextInput } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import { DateField } from "@/components/date-field";
import { DestructiveButton } from "@/components/destructive-button";
import { FormList } from "@/components/form-list";
import { SelectRow } from "@/components/select-row";
import { TaskCheckbox } from "@/components/task-checkbox";
import { deleteEntry, saveEntry } from "@/db/actions";
import type { Entry, EntryType, Lesson, Period, Settings, Subject } from "@/db/schema";
import { confirmDelete } from "@/lib/confirm-delete";
import { addDays, formatDate, today } from "@/lib/dates";
import {
  defaultLeadDays,
  ENTRY_TYPE_INFO,
  ENTRY_TYPE_OPTIONS,
  isCheckable,
} from "@/lib/entry-types";
import { subjectLessonOn, upcomingSubjectLessons } from "@/lib/schedule";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { useSaveButton } from "@/hooks/use-save-button";

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
  studyStart: string | null;
  topic: string;
  // Set once the user picks the value, so it is no longer derived automatically
  dateTouched: boolean;
  periodTouched: boolean;
  studyStartTouched: boolean;
};

type EntryFormProps = {
  entry: Entry | undefined;
  initialSubjectId: number | null;
  subjects: Subject[];
  periods: Period[];
  lessons: Lesson[];
  settings: Settings;
};

export function EntryForm({
  entry,
  initialSubjectId,
  subjects,
  periods,
  lessons,
  settings,
}: EntryFormProps) {
  const upcoming = (subjectId: number) => upcomingSubjectLessons(subjectId, lessons, periods, 2);

  // Fills in the due date, period and study start that follow from the other fields.
  const derive = (state: FormState): FormState => {
    const next = { ...state };

    if (next.type === "homework") {
      if (next.dueChoice !== "custom") {
        const [first, second] = upcoming(next.subjectId);
        const pick = next.dueChoice === "next" ? first : (second ?? first);
        next.date = pick?.date ?? addDays(today(), 1);
        next.periodId = pick?.period.id ?? NONE;
      }
    } else {
      if (!next.dateTouched) {
        next.date = upcoming(next.subjectId)[0]?.date ?? addDays(today(), 1);
      }
      if (!next.periodTouched) {
        next.periodId =
          subjectLessonOn(next.subjectId, next.date, lessons, periods)?.period.id ?? NONE;
      }
    }

    const leadDays = defaultLeadDays(next.type, settings);
    if (leadDays === null) {
      next.studyStart = null;
    } else if (!next.studyStartTouched || next.studyStart === null) {
      // Not before today, but never after the entry itself
      const suggested = addDays(next.date, -leadDays);
      next.studyStart = suggested >= today() ? suggested : [today(), next.date].sort()[0];
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
          studyStart: entry.studyStart,
          topic: entry.topic ?? "",
          dateTouched: true,
          periodTouched: true,
          studyStartTouched: true,
        }
      : derive({
          type: "homework",
          title: "",
          description: "",
          subjectId: initialSubjectId ?? NONE,
          date: today(),
          periodId: NONE,
          dueChoice: "next",
          completed: false,
          studyStart: null,
          topic: "",
          dateTouched: false,
          periodTouched: false,
          studyStartTouched: false,
        })
  );

  const change = (changes: Partial<FormState>) =>
    setForm((state) => derive({ ...state, ...changes }));

  const info = ENTRY_TYPE_INFO[form.type];
  const [nextLesson, lessonAfter] = upcoming(form.subjectId);
  const canSave = form.title.trim().length > 0;

  const saveButton = useSaveButton();

  const save = async () => {
    await saveEntry(entry?.id ?? null, {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      subjectId: form.subjectId === NONE ? null : form.subjectId,
      date: form.date,
      periodId: form.periodId === NONE ? null : form.periodId,
      completed: isCheckable(form.type) && form.completed,
      studyStart: form.studyStart,
      topic: info.gradable ? form.topic.trim() || null : null,
    });
    router.back();
  };

  const remove = () => {
    if (!entry) return;
    confirmDelete("Eintrag löschen?", `«${entry.title}» wird gelöscht.`, () =>
      deleteEntry(entry.id)
    );
  };

  return (
    <>
      <Stack.Title>{entry ? info.label : "Neuer Eintrag"}</Stack.Title>
      {/* Android shows the back arrow instead */}
      {Platform.OS === "ios" && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button onPress={() => router.back()}>Abbrechen</Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      <Stack.Toolbar placement="right">
        {saveButton && <Stack.Toolbar.Button {...saveButton} disabled={!canSave} onPress={save} />}
      </Stack.Toolbar>

      <FormList>
        <FieldGroup.Section>
          <SelectRow
            label="Typ"
            value={form.type}
            onChange={(type) => change({ type })}
            options={ENTRY_TYPE_OPTIONS}
          />
          <TextInput
            placeholder={form.type === "homework" ? "Aufgabe" : "Titel"}
            defaultValue={form.title}
            autoFocus={!entry}
            onChangeText={(title) => change({ title })}
          />
          <SelectRow
            label="Fach"
            value={form.subjectId}
            onChange={(subjectId) => change({ subjectId })}
            options={[
              { label: "Allgemein", value: NONE },
              ...subjects.map((subject) => ({ label: subject.name, value: subject.id })),
            ]}
          />
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
          {isCheckable(form.type) && entry && (
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

        {info.gradable && form.studyStart && (
          <FieldGroup.Section title="Vorbereitung">
            <DateField
              label="Lernbeginn"
              value={form.studyStart}
              onChange={(studyStart) => change({ studyStart, studyStartTouched: true })}
            />
            <TextInput
              placeholder="Stoff"
              defaultValue={form.topic}
              multiline
              onChangeText={(topic) => change({ topic })}
            />
          </FieldGroup.Section>
        )}

        <FieldGroup.Section title="Notizen">
          <TextInput
            placeholder="Beschreibung"
            defaultValue={form.description}
            multiline
            onChangeText={(description) => change({ description })}
          />
        </FieldGroup.Section>

        {entry && (
          <FieldGroup.Section>
            <DestructiveButton label="Eintrag löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
