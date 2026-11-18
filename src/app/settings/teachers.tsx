import { FieldGroup, Text } from "@expo/ui";
import { Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { useSubjects, useTeachers } from "@/db/queries";
import { useInk } from "@/hooks/use-ink";
import { t } from "@/i18n";
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
      <Stack.Title>{t.school.teachers.title}</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          {teachers.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>{t.school.teachers.empty}</Text>
          )}
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
          <ActionRow label={t.school.teachers.add} onPress={() => openTeacher("new")} />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
