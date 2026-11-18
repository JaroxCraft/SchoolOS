import { router } from "expo-router";

import { deleteEntry, deleteSubject, deleteTeacher } from "@/db/actions";
import type { Entry, Subject, Teacher } from "@/db/schema";
import { t } from "@/i18n";
import { confirm } from "@/lib/confirm";
import type { RowAction } from "@/lib/row-action";

export function confirmDelete({ title, message, onDelete }: Deletion, allowLeave: () => void) {
  confirm({
    title,
    message,
    confirmLabel: t.common.delete,
    onConfirm: async () => {
      allowLeave();
      router.back();
      await onDelete();
    },
  });
}

export type Deletion = { title: string; message: string; onDelete: () => Promise<void> };

export const entryDeletion = (entry: Entry): Deletion => ({
  title: t.entries.deletion.title(entry.title),
  message: t.entries.deletion.message,
  onDelete: () => deleteEntry(entry.id),
});

export const subjectDeletion = (subject: Subject): Deletion => ({
  title: t.school.subjectDeletion.title(subject.name),
  message: t.school.subjectDeletion.message,
  onDelete: () => deleteSubject(subject.id),
});

export const teacherDeletion = (teacher: Teacher): Deletion => ({
  title: t.school.teacherDeletion.title(teacher.name),
  message: t.school.teacherDeletion.message,
  onDelete: () => deleteTeacher(teacher.id),
});

export function deleteAction({ title, message, onDelete }: Deletion): RowAction {
  return {
    label: t.common.delete,
    icon: "trash",
    destructive: true,
    asksFirst: true,
    onPress: () => confirm({ title, message, confirmLabel: t.common.delete, onConfirm: onDelete }),
  };
}

export function editAction(onPress: () => void, tint?: string): RowAction {
  return { label: t.common.edit, icon: "pencil", onPress, tint };
}
