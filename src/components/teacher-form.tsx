import { FieldGroup } from "@expo/ui";
import { Stack } from "expo-router";

import { DiscardGuard } from "@/components/discard-guard";
import { FormList } from "@/components/form-list";
import { DestructiveRow } from "@/components/rows";
import { useTeacherDraft } from "@/components/teacher-draft";
import type { Teacher } from "@/db/schema";
import { useClosingForm } from "@/hooks/use-closing-form";
import { useSaveButton } from "@/hooks/use-header-button";
import { teacherDeletion } from "@/lib/confirm-delete";

type TeacherFormProps = {
  teacher: Teacher | undefined;
};

export function TeacherForm({ teacher }: TeacherFormProps) {
  const draft = useTeacherDraft(teacher);
  const saveButton = useSaveButton();
  const { saving, saveAndClose, deleteAndClose } = useClosingForm(draft.dirty);
  const save = () => saveAndClose(draft.save);

  const remove = () => {
    if (!teacher) return;
    deleteAndClose(teacherDeletion(teacher));
  };

  return (
    <>
      <Stack.Title>{teacher ? teacher.name : "Neue Lehrperson"}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && (
          <Stack.Toolbar.Button
            {...saveButton}
            disabled={!draft.canSave || saving}
            onPress={save}
          />
        )}
      </Stack.Toolbar>

      <DiscardGuard dirty={draft.dirty}>
        <FormList>
          <FieldGroup.Section>{draft.fields}</FieldGroup.Section>

          {teacher && (
            <FieldGroup.Section>
              <DestructiveRow label="Lehrperson löschen" onPress={remove} />
            </FieldGroup.Section>
          )}
        </FormList>
      </DiscardGuard>
    </>
  );
}
