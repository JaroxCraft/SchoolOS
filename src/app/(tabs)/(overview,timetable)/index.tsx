import { FieldGroup, Text } from "@expo/ui";
import { router } from "expo-router";

import { EntryRow } from "@/components/entry-row";
import { FooterText, FormList } from "@/components/form-list";
import { RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { Screen } from "@/components/screen";
import { SubjectDot } from "@/components/subject-dot";
import { useEntries, useLessons, usePeriods, useSubjects } from "@/db/queries";
import type { Period, Subject } from "@/db/schema";
import { useInk } from "@/hooks/use-ink";
import { useNow } from "@/hooks/use-now";
import { useWasCompleted } from "@/hooks/use-recently-completed";
import { formatDate, relativeDay } from "@/lib/dates";
import { isCheckable } from "@/lib/entry-types";
import { nextLessons, periodNumber, periodRange } from "@/lib/schedule";
import { openEntry, SCHOOL_ROUTES } from "@/lib/routes";
import { SETUP_STEP_ICONS } from "@/lib/setup";
import { joinDetails } from "@/lib/text";
import { pickAndImport } from "@/lib/transfer-file";

const UPCOMING_EVENTS = 5;
const DONE_ICON = { sf: "checkmark", md: "check", color: "#34C759" } as const;

type SetupProps = { periods: Period[]; subjects: Subject[] };

// Shown until the timetable has lessons: the three steps in the order they depend on each other,
// and importing the timetable of a classmate as a shortcut. A step is pushed onto this tab; each
// leads on to the next with "Weiter", the last one comes back here with "Fertig".
function Setup({ periods, subjects }: SetupProps) {
  const steps = [
    {
      title: "Lektionenraster erfassen",
      done: periods.length > 0,
      detail:
        periods.length > 0
          ? `${periods.length} Lektionen, ${periods[0].startTime}–${periods.at(-1)!.endTime}`
          : "Wann deine Lektionen beginnen und enden",
      icon: SETUP_STEP_ICONS.periods,
      href: SCHOOL_ROUTES.setup.periods,
    },
    {
      title: "Fächer erfassen",
      done: subjects.length > 0,
      detail: subjects.length > 0 ? `${subjects.length} Fächer` : "Mit Kürzel und Farbe",
      icon: SETUP_STEP_ICONS.subjects,
      href: SCHOOL_ROUTES.setup.subjects,
    },
    {
      title: "Stundenplan ausfüllen",
      done: false,
      detail: "Welches Fach du wann hast",
      icon: SETUP_STEP_ICONS.timetable,
      href: SCHOOL_ROUTES.setup.timetable,
    },
  ] as const;

  return (
    <FormList floatingButton>
      <FieldGroup.Section title="Einrichten">
        {steps.map((step) => (
          <NavigationRow
            key={step.title}
            icon={step.done ? DONE_ICON : step.icon}
            supportingText={step.detail}
            onPress={() => router.push(step.href)}>
            {step.title}
          </NavigationRow>
        ))}
        <FieldGroup.SectionFooter>
          <FooterText>
            Danach zeigt die Übersicht deine nächsten Lektionen, offenen Aufgaben und Prüfungen.
          </FooterText>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>

      <FieldGroup.Section title="Schneller">
        <ActionRow label="Stundenplan importieren" onPress={() => pickAndImport()} />
        <FieldGroup.SectionFooter>
          <FooterText>
            Hat jemand aus deiner Klasse SchoolOS schon eingerichtet? Unter Einstellungen › Teilen
            lässt sich der Stundenplan als Datei schicken.
          </FooterText>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>
    </FormList>
  );
}

export default function OverviewScreen() {
  const ink = useInk();
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();
  const entries = useEntries();
  const wasCompleted = useWasCompleted();
  const now = useNow();

  const subjectById = (id: number | null) => subjects.find((subject) => subject.id === id);

  if (lessons.length === 0) {
    return (
      <Screen title="Übersicht" showAddButton>
        <Setup periods={periods} subjects={subjects} />
      </Screen>
    );
  }

  const upcomingLessons = nextLessons(lessons, periods, now);
  // Tasks checked off here stay until the screen is left, so they can be unchecked again
  const openTasks = entries.filter((entry) => isCheckable(entry.type) && !wasCompleted(entry));
  const upcomingEvents = entries
    .filter(
      (entry) => (entry.type === "exam" || entry.type === "presentation") && entry.date >= now.date
    )
    .slice(0, UPCOMING_EVENTS);

  const lessonsDate = upcomingLessons[0]?.date;

  return (
    <Screen title="Übersicht" showAddButton>
      <FormList floatingButton>
        <FieldGroup.Section
          title={
            lessonsDate
              ? `Lektionen ${relativeDay(lessonsDate, now.date)}, ${formatDate(lessonsDate)}`
              : "Lektionen"
          }>
          {upcomingLessons.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine Lektionen im Stundenplan</Text>
          )}
          {/* A long press offers a new entry for the subject and the subject itself */}
          {upcomingLessons.map(({ lesson, period }) => {
            const subject = subjectById(lesson.subjectId);
            const openSubject = () =>
              router.push({
                pathname: "/subject/[subjectId]",
                params: { subjectId: String(lesson.subjectId) },
              });
            return (
              <RowActions
                key={lesson.id}
                menu={[
                  {
                    label: "Neuer Eintrag",
                    icon: "plus",
                    onPress: () => openEntry({ id: "new", subjectId: lesson.subjectId }),
                  },
                  { label: "Fach anzeigen", icon: "book", onPress: openSubject },
                ]}>
                <NavigationRow
                  onPress={openSubject}
                  leading={<SubjectDot color={subject?.color ?? ink.secondary} />}
                  supportingText={joinDetails(periodRange(period), lesson.room)}>
                  {`${periodNumber(periods, period.id)}. ${subject?.name ?? ""}`}
                </NavigationRow>
              </RowActions>
            );
          })}
        </FieldGroup.Section>

        <FieldGroup.Section title="Offene Aufgaben">
          {openTasks.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Alles erledigt</Text>
          )}
          {openTasks.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              subject={subjectById(entry.subjectId)}
              today={now.date}
            />
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Prüfungen und Präsentationen">
          {upcomingEvents.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine anstehenden Termine</Text>
          )}
          {upcomingEvents.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              subject={subjectById(entry.subjectId)}
              today={now.date}
            />
          ))}
          {/* Switches to the Agenda tab, so it is an action and not a pushed screen */}
          <ActionRow label="Alle in der Agenda" onPress={() => router.navigate("/agenda")} />
        </FieldGroup.Section>
      </FormList>
    </Screen>
  );
}
