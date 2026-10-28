import { useLocalSearchParams } from "expo-router";

import { SubjectForm } from "@/components/subject-form";
import { useSubjects } from "@/db/queries";

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subjects = useSubjects();
  const subject = subjects.find((candidate) => String(candidate.id) === id);

  if (id !== "new" && !subject) return null;

  return (
    <SubjectForm subject={subject} usedColors={subjects.map((candidate) => candidate.color)} />
  );
}
