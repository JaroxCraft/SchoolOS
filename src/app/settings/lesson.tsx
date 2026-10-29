import { useLocalSearchParams } from "expo-router";

import { LessonForm } from "@/components/lesson-form";
import { useLessons, usePeriods, useSubjects } from "@/db/queries";
import { lessonAt, periodNumber } from "@/lib/schedule";

export default function LessonScreen() {
  const params = useLocalSearchParams<{ weekday: string; periodId: string }>();
  const weekday = Number(params.weekday);
  const periodId = Number(params.periodId);
  const subjects = useSubjects();
  const periods = usePeriods();
  const lessons = useLessons();

  return (
    <LessonForm
      weekday={weekday}
      periodId={periodId}
      periodNumber={periodNumber(periods, periodId)}
      lesson={lessonAt(lessons, weekday, periodId)}
      subjects={subjects}
    />
  );
}
