import { router } from "expo-router";

import { deleteEntry, deleteSubject, deleteTeacher } from "@/db/actions";
import type { Entry, Subject, Teacher } from "@/db/schema";
import { confirm } from "@/lib/confirm";
import type { RowAction } from "@/lib/row-action";

export function confirmDelete({ title, message, onDelete }: Deletion, allowLeave: () => void) {
  confirm({
    title,
    message,
    confirmLabel: "Löschen",
    onConfirm: async () => {
      allowLeave();
      router.back();
      await onDelete();
    },
  });
}

export type Deletion = { title: string; message: string; onDelete: () => Promise<void> };

export const entryDeletion = (entry: Entry): Deletion => ({
  title: `«${entry.title}» löschen?`,
  message: "Der Eintrag wird gelöscht.",
  onDelete: () => deleteEntry(entry.id),
});

export const subjectDeletion = (subject: Subject): Deletion => ({
  title: `«${subject.name}» löschen?`,
  message:
    "Die Lektionen und Noten des Fachs werden gelöscht. Einträge bleiben und erscheinen unter «Allgemein».",
  onDelete: () => deleteSubject(subject.id),
});

export const teacherDeletion = (teacher: Teacher): Deletion => ({
  title: `«${teacher.name}» löschen?`,
  message: "Die Fächer dieser Lehrperson bleiben bestehen, aber ohne Lehrperson.",
  onDelete: () => deleteTeacher(teacher.id),
});

export function deleteAction({ title, message, onDelete }: Deletion): RowAction {
  return {
    label: "Löschen",
    icon: "trash",
    destructive: true,
    asksFirst: true,
    onPress: () => confirm({ title, message, confirmLabel: "Löschen", onConfirm: onDelete }),
  };
}

export function editAction(onPress: () => void, tint?: string): RowAction {
  return { label: "Bearbeiten", icon: "pencil", onPress, tint };
}
