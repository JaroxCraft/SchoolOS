import { FieldGroup, Text } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { type RowAction, RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { useSubjects, useTeachers } from "@/db/queries";
import { useInk } from "@/hooks/use-ink";
import { confirmRowDelete, teacherDeletion } from "@/lib/confirm-delete";
import { joinDetails } from "@/lib/text";

export default function TeachersScreen() {
  const teachers = useTeachers();
  const subjects = useSubjects();
  const ink = useInk();

  const openTeacher = (id: string) =>
    router.push({ pathname: "/settings/teacher/[id]", params: { id } });

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
