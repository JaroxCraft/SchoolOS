import { FieldGroup, Text } from "@expo/ui";
import { Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { useSubjects, useTeachers } from "@/db/queries";
import { useInk } from "@/hooks/use-ink";
import { deleteAction, editAction, teacherDeletion } from "@/lib/confirm-delete";
import { openScreen } from "@/lib/routes";
import { joinDetails } from "@/lib/text";

export default function TeachersScreen() {
  const teachers = useTeachers();
  const subjects = useSubjects();
  const ink = useInk();

  const openTeacher = (id: string) =>
    openScreen({ pathname: "/settings/teacher/[id]", params: { id } });

  return (
    <>
      <Stack.Title>Lehrpersonen</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          {teachers.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine Lehrpersonen</Text>
          )}
          {/* iOS: swipe left or long press to delete (asked first), long press to edit */}
          {teachers.map((teacher) => {
            const remove = deleteAction(teacherDeletion(teacher));
            const menu = [editAction(() => openTeacher(String(teacher.id))), remove];
            return (
              <RowActions key={teacher.id} trailing={[remove]} menu={menu}>
                <NavigationRow
                  onPress={() => openTeacher(String(teacher.id))}
                  supportingText={joinDetails(
                    teacher.abbreviation,
                    subjects
                      .filter((subject) => subject.teacherId === teacher.id)
                      .map((subject) => subject.abbreviation)
                      .join(", ")
                  )}>
                  {teacher.name}
                </NavigationRow>
              </RowActions>
            );
          })}
          <ActionRow label="Lehrperson hinzufügen" onPress={() => openTeacher("new")} />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
