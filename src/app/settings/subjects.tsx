import { FieldGroup, ListItem } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { SubjectDot } from "@/components/subject-dot";
import { useSubjects, useTeachers } from "@/db/queries";

const openSubject = (id: string) =>
  router.push({ pathname: "/settings/subject/[id]", params: { id } });

export default function SubjectsScreen() {
  const subjects = useSubjects();
  const teachers = useTeachers();

  return (
    <>
      <Stack.Title>Fächer</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          {subjects.map((subject) => (
            <ListItem
              key={subject.id}
              onPress={() => openSubject(String(subject.id))}
              leading={<SubjectDot color={subject.color} />}
              supportingText={[
                subject.abbreviation,
                teachers.find((teacher) => teacher.id === subject.teacherId)?.name,
              ]
                .filter(Boolean)
                .join(" · ")}>
              {subject.name}
            </ListItem>
          ))}
          <ListItem onPress={() => openSubject("new")}>Fach hinzufügen</ListItem>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
