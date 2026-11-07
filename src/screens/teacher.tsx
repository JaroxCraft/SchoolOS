import { useLocalSearchParams } from "expo-router";

import { TeacherForm } from "@/components/teacher-form";
import { useTeachers } from "@/db/queries";

export default function TeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teacher = useTeachers().find((candidate) => String(candidate.id) === id);

  if (id !== "new" && !teacher) return null;

  return <TeacherForm teacher={teacher} />;
}
