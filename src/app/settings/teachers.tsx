import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { type RowAction, RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { useSubjects, useTeachers } from "@/db/queries";
import { confirmRowDelete, teacherDeletion } from "@/lib/confirm-delete";
import { joinDetails } from "@/lib/text";

const openTeacher = (id: string) =>
  router.push({ pathname: "/settings/teacher/[id]", params: { id } });

export default function TeachersScreen() {
  const teachers = useTeachers();
  const subjects = useSubjects();

  return (
    <>
      <Stack.Title>Lehrpersonen</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          {/* iOS: swipe left or long press to delete (asked first); long press also to edit */}
          {teachers.map((teacher) => {
            const remove: RowAction = {
              label: "Löschen",
              icon: "trash",
              destructive: true,
              asksFirst: true,
              onPress: () => confirmRowDelete(teacherDeletion(teacher)),
            };
            const menu: RowAction[] = [
              {
                label: "Bearbeiten",
                icon: "pencil",
                onPress: () => openTeacher(String(teacher.id)),
              },
              remove,
            ];
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
