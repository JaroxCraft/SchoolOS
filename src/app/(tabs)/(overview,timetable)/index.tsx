import { FieldGroup, Text } from "@expo/ui";
import { router } from "expo-router";

import { EntryRow } from "@/components/entry-row";
import { FooterText, FormList, rowsKey } from "@/components/form-list";
import { RowActions } from "@/components/row-actions";
import { ActionRow, NavigationRow } from "@/components/rows";
import { Screen } from "@/components/screen";
import { SubjectDot } from "@/components/subject-dot";
import { useEntries, useLessons, usePeriods, useSubjects } from "@/db/queries";
import type { Period, Subject } from "@/db/schema";
import { useEntryPlacement } from "@/hooks/use-entry-placement";
import { useInk } from "@/hooks/use-ink";
import { useNow } from "@/hooks/use-now";
import { formatDate, relativeDay } from "@/lib/dates";
import { lessonActions, openSubject, SCHOOL_ROUTES } from "@/lib/routes";
import { nextLessons, periodNumber, periodRange } from "@/lib/schedule";
import { SETUP_STEP_ICONS } from "@/lib/setup";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { SYSTEM_COLORS } from "@/lib/system-colors";
import { countOf, joinDetails } from "@/lib/text";
import { pickAndImport } from "@/lib/transfer-file";

const DONE_ICON = { sf: "checkmark", md: "check", color: SYSTEM_COLORS.green } as const;

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
          ? `${countOf(periods.length, "Lektionszeit", "Lektionszeiten")}, ${periods[0].startTime}–${periods.at(-1)!.endTime}`
          : "Wann deine Lektionen beginnen und enden",
      icon: SETUP_STEP_ICONS.periods,
      href: SCHOOL_ROUTES.setup.periods,
    },
    {
      title: "Fächer erfassen",
      done: subjects.length > 0,
      detail:
        subjects.length > 0 ? countOf(subjects.length, "Fach", "Fächer") : "Mit Kürzel und Farbe",
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
            Danach zeigt die Übersicht deine nächsten Lektionen und alle offenen Einträge.
          </FooterText>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>

      <FieldGroup.Section title="Schneller">
        <ActionRow label="Stundenplan importieren" onPress={() => pickAndImport()} />
        <FieldGroup.SectionFooter>
          <FooterText>
            Hat jemand aus deiner Klasse SchoolOS schon eingerichtet? Unter Einstellungen › Teilen
            lässt sich der Stundenplan als Datei schicken. Importieren lassen sich nur solche
            SchoolOS-Dateien (JSON), keine PDFs oder Bilder eines Stundenplans.
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
  const placeEntries = useEntryPlacement();
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
  // Every open entry in one list by date, whatever its type; overdue and missed ones in red.
  // One checked off here leaves the list after a moment, animated.
  const openEntries = placeEntries(entries).open;

  const lessonsDate = upcomingLessons[0]?.date;

  return (
    <Screen title="Übersicht" showAddButton>
      <FormList floatingButton rowsKey={rowsKey(openEntries)}>
        <FieldGroup.Section
          title={
            lessonsDate
              ? `Lektionen ${relativeDay(lessonsDate, now.date)}, ${formatDate(lessonsDate)}`
              : "Lektionen"
          }>
          {upcomingLessons.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Keine Lektionen im Stundenplan</Text>
          )}
          {/* A long press offers the actions of every lesson, as on the timetable cards */}
          {upcomingLessons.map(({ lesson, period }) => {
            const subject = subjectById(lesson.subjectId);
            return (
              <RowActions key={lesson.id} menu={lessonActions(lesson.subjectId)}>
                <NavigationRow
                  onPress={() => openSubject(lesson.subjectId)}
                  leading={<SubjectDot color={subject?.color ?? NEUTRAL_COLOR} />}
                  supportingText={joinDetails(periodRange(period), lesson.room)}>
                  {`${periodNumber(periods, period.id)}. ${subject?.name ?? ""}`}
                </NavigationRow>
              </RowActions>
            );
          })}
        </FieldGroup.Section>

        <FieldGroup.Section title="Offene Einträge">
          {openEntries.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>Alles erledigt</Text>
          )}
          {openEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              subject={subjectById(entry.subjectId)}
              today={now.date}
            />
          ))}
        </FieldGroup.Section>
      </FormList>
    </Screen>
  );
}
