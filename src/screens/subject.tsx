import { useLocalSearchParams } from "expo-router";

import { SubjectForm } from "@/components/subject-form";
import { useSubjects, useTeachers } from "@/db/queries";

export default function SubjectEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subjects = useSubjects();
  const teachers = useTeachers();
  const subject = subjects.find((candidate) => String(candidate.id) === id);

  if (id !== "new" && !subject) return null;

  return (
    <SubjectForm
      subject={subject}
      allColors={subjects.map((candidate) => candidate.color)}
      usedColors={subjects
        .filter((candidate) => candidate.id !== subject?.id)
        .map((candidate) => candidate.color)}
      teachers={teachers}
    />
  );
}
