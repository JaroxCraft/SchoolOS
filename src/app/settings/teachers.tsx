import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { ActionRow, NavigationRow } from "@/components/rows";
import { useSubjects, useTeachers } from "@/db/queries";
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
          {teachers.map((teacher) => (
            <NavigationRow
              key={teacher.id}
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
          ))}
          <ActionRow label="Lehrperson hinzufügen" onPress={() => openTeacher("new")} />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
