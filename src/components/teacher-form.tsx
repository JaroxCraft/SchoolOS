import { FieldGroup } from "@expo/ui";

import { PushedForm } from "@/components/pushed-form";
import { DestructiveRow } from "@/components/rows";
import { useTeacherDraft } from "@/components/teacher-draft";
import type { Teacher } from "@/db/schema";
import { useClosingForm } from "@/hooks/use-closing-form";
import { teacherDeletion } from "@/lib/confirm-delete";

type TeacherFormProps = {
  teacher: Teacher | undefined;
};

export function TeacherForm({ teacher }: TeacherFormProps) {
  const draft = useTeacherDraft(teacher);
  const { saving, saveAndClose, deleteAndClose } = useClosingForm(draft.dirty);
  const save = () => saveAndClose(draft.save);

  const remove = () => {
    if (!teacher) return;
    deleteAndClose(teacherDeletion(teacher));
  };

  return (
    <PushedForm
      title={teacher ? teacher.name : "Neue Lehrperson"}
      canSave={draft.canSave && !saving}
      dirty={draft.dirty}
      onSave={save}>
      <FieldGroup.Section>{draft.fields}</FieldGroup.Section>

      {teacher && (
        <FieldGroup.Section>
          <DestructiveRow label="Lehrperson löschen" onPress={remove} />
        </FieldGroup.Section>
      )}
    </PushedForm>
  );
}
