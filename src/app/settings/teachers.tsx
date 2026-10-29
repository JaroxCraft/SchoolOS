import { FieldGroup, ListItem } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
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
            <ListItem
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
            </ListItem>
          ))}
          <ListItem onPress={() => openTeacher("new")}>Lehrperson hinzufügen</ListItem>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
