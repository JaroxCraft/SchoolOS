import { FieldGroup, ListItem, Text } from "@expo/ui";
import { router } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { EntryRow } from "@/components/entry-row";
import { FormList } from "@/components/form-list";
import { Screen } from "@/components/screen";
import { SubjectDot } from "@/components/subject-dot";
import { useEntries, useLessons, usePeriods, useSubjects } from "@/db/queries";
import { formatDate, relativeDay, today } from "@/lib/dates";
import { isCheckable } from "@/lib/entry-types";
import { nextLessons, periodNumber, periodRange } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";
import { useInk } from "@/hooks/use-ink";

const UPCOMING_EVENTS = 5;

export default function OverviewScreen() {
  const ink = useInk();
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();
  const entries = useEntries();

  const subjectById = (id: number | null) => subjects.find((subject) => subject.id === id);

  if (periods.length === 0 || subjects.length === 0) {
    return (
      <Screen title="Übersicht" showAddButton>
        <EmptyState
          title="Willkommen bei SchoolOS"
          message="Erfasse über das Zahnrad oben rechts dein Lektionenraster, deine Fächer und deinen Stundenplan."
        />
      </Screen>
    );
  }

  const upcomingLessons = nextLessons(lessons, periods);
  const openTasks = entries.filter((entry) => isCheckable(entry.type) && !entry.completed);
  const upcomingEvents = entries
    .filter(
      (entry) => (entry.type === "exam" || entry.type === "presentation") && entry.date >= today()
    )
    .slice(0, UPCOMING_EVENTS);

  const lessonsDate = upcomingLessons[0]?.date;

  return (
    <Screen title="Übersicht" showAddButton>
      <FormList>
        <FieldGroup.Section
          title={
            lessonsDate
              ? `Lektionen ${relativeDay(lessonsDate)}, ${formatDate(lessonsDate)}`
              : "Lektionen"
          }>
          {upcomingLessons.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine Lektionen im Stundenplan</Text>
          )}
          {upcomingLessons.map(({ lesson, period }) => {
            const subject = subjectById(lesson.subjectId);
            return (
              <ListItem
                key={lesson.id}
                onPress={() =>
                  router.push({
                    pathname: "/timetable/[subjectId]",
                    params: { subjectId: String(lesson.subjectId) },
                  })
                }
                leading={<SubjectDot color={subject?.color ?? ink.secondary} />}
                supportingText={joinDetails(periodRange(period), lesson.room)}>
                {`${periodNumber(periods, period.id)}. ${subject?.name ?? ""}`}
              </ListItem>
            );
          })}
        </FieldGroup.Section>

        <FieldGroup.Section title="Offene Aufgaben">
          {openTasks.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Alles erledigt</Text>
          )}
          {openTasks.map((entry) => (
            <EntryRow key={entry.id} entry={entry} subject={subjectById(entry.subjectId)} />
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Prüfungen und Präsentationen">
          {upcomingEvents.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine anstehenden Termine</Text>
          )}
          {upcomingEvents.map((entry) => (
            <EntryRow key={entry.id} entry={entry} subject={subjectById(entry.subjectId)} />
          ))}
          <ListItem onPress={() => router.navigate("/agenda")}>Alle anzeigen</ListItem>
        </FieldGroup.Section>
      </FormList>
    </Screen>
  );
}
