import { router } from "expo-router";

import { deleteEntry, deleteSubject, deleteTeacher } from "@/db/actions";
import type { Entry, Subject, Teacher } from "@/db/schema";
import { confirm } from "@/lib/confirm";

// Asks before deleting the item of the current screen, then closes the screen and deletes it.
// `allowLeave` lifts the form's discard guard (useDiscardGuard) before the screen closes.
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

// What deleting an entry, subject or teacher does, asked the same way from its form and from its
// row: the name in the title, what else happens in the message.
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

// Asks before deleting an entry, subject or teacher from its row in a list
export function confirmRowDelete({ title, message, onDelete }: Deletion) {
  confirm({ title, message, confirmLabel: "Löschen", onConfirm: onDelete });
}
