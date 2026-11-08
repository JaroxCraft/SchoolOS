import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { SubjectDot } from "@/components/subject-dot";
import { useSubjects, useTeachers } from "@/db/queries";
import { useStepButton } from "@/hooks/use-header-button";
import { confirmRowDelete, subjectDeletion } from "@/lib/confirm-delete";
import { useSchoolRoutes } from "@/lib/routes";
import { joinDetails } from "@/lib/text";

export default function SubjectsScreen() {
  const subjects = useSubjects();
  const teachers = useTeachers();
  const routes = useSchoolRoutes();
  const nextButton = useStepButton("next");

  const openSubject = (id: string) => router.push({ pathname: routes.subject, params: { id } });

  return (
    <>
      <Stack.Title>Fächer</Stack.Title>
      {/* Setup: the second step, leading on to the timetable once there is a subject */}
      {routes.setup && (
        <Stack.Toolbar placement="right">
          {nextButton && (
            <Stack.Toolbar.Button
              {...nextButton}
              disabled={subjects.length === 0}
              onPress={() => router.push(routes.timetable)}
            />
          )}
        </Stack.Toolbar>
      )}
      <FormList>
        <FieldGroup.Section>
          {/* iOS: swipe left or long press to delete (asked first), long press to edit */}
          {subjects.map((subject) => {
            const remove = {
              label: "Löschen",
              icon: "trash",
              destructive: true,
              asksFirst: true,
              onPress: () => confirmRowDelete(subjectDeletion(subject)),
            } as const;
            return (
              <RowActions
                key={subject.id}
                trailing={[remove]}
                menu={[
                  {
                    label: "Bearbeiten",
                    icon: "pencil",
                    onPress: () => openSubject(String(subject.id)),
                  },
                  remove,
                ]}>
                <NavigationRow
                  onPress={() => openSubject(String(subject.id))}
                  leading={<SubjectDot color={subject.color} />}
                  supportingText={joinDetails(
                    subject.abbreviation,
                    teachers.find((teacher) => teacher.id === subject.teacherId)?.name
                  )}>
                  {subject.name}
                </NavigationRow>
              </RowActions>
            );
          })}
          <ActionRow label="Fach hinzufügen" onPress={() => openSubject("new")} />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
