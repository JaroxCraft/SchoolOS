import { FieldGroup, Text } from "@expo/ui";

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
import { t } from "@/i18n";
import { formatDate, relativeDay } from "@/lib/dates";
import { findById } from "@/lib/find";
import { lessonActions } from "@/lib/lesson-actions";
import { openScreen, openSubject, SCHOOL_ROUTES } from "@/lib/routes";
import { nextLessons, periodNumber, periodRange } from "@/lib/schedule";
import { SETUP_STEP_ICONS } from "@/lib/setup";
import { NO_SUBJECT_COLOR } from "@/lib/subject-colors";
import { SYSTEM_COLORS } from "@/lib/system-colors";
import { joinDetails } from "@/lib/text";
import { pickAndImport } from "@/lib/transfer-file";

const DONE_ICON = { sf: "checkmark", md: "check", color: SYSTEM_COLORS.green } as const;

type SetupProps = { periods: Period[]; subjects: Subject[] };

function Setup({ periods, subjects }: SetupProps) {
  const steps = [
    {
      title: t.school.setupSteps.periods,
      done: periods.length > 0,
      detail:
        periods.length > 0
          ? t.overview.setup.periods.detail({
              count: periods.length,
              start: periods[0].startTime,
              end: periods.at(-1)!.endTime,
            })
          : t.overview.setup.periods.empty,
      icon: SETUP_STEP_ICONS.periods,
      href: SCHOOL_ROUTES.setup.periods,
    },
    {
      title: t.school.setupSteps.subjects,
      done: subjects.length > 0,
      detail:
        subjects.length > 0
          ? t.school.counts.subjects(subjects.length)
          : t.overview.setup.subjects.empty,
      icon: SETUP_STEP_ICONS.subjects,
      href: SCHOOL_ROUTES.setup.subjects,
    },
    {
      title: t.school.setupSteps.timetable,
      done: false,
      detail: t.overview.setup.timetable.detail,
      icon: SETUP_STEP_ICONS.timetable,
      href: SCHOOL_ROUTES.setup.timetable,
    },
  ] as const;

  return (
    <FormList floatingButton>
      <FieldGroup.Section title={t.overview.setup.title}>
        {steps.map((step) => (
          <NavigationRow
            key={step.title}
            icon={step.done ? DONE_ICON : step.icon}
            supportingText={step.detail}
            onPress={() => openScreen(step.href)}>
            {step.title}
          </NavigationRow>
        ))}
        <FieldGroup.SectionFooter>
          <FooterText>{t.overview.setup.footer}</FooterText>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>

      <FieldGroup.Section title={t.overview.importShortcut.title}>
        <ActionRow label={t.overview.importShortcut.action} onPress={() => pickAndImport()} />
        <FieldGroup.SectionFooter>
          <FooterText>{t.overview.importShortcut.footer}</FooterText>
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

  if (lessons.length === 0) {
    return (
      <Screen title={t.common.tabs.overview} showAddButton>
        <Setup periods={periods} subjects={subjects} />
      </Screen>
    );
  }

  const upcomingLessons = nextLessons(lessons, periods, now);
  const openEntries = placeEntries(entries).open;

  const lessonsDate = upcomingLessons[0]?.date;

  return (
    <Screen title={t.common.tabs.overview} showAddButton>
      <FormList floatingButton rowsKey={rowsKey(openEntries)}>
        <FieldGroup.Section
          title={
            lessonsDate
              ? t.overview.lessons.titleOn({
                  day: relativeDay(lessonsDate, now.date),
                  date: formatDate(lessonsDate),
                })
              : t.overview.lessons.title
          }>
          {upcomingLessons.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>{t.overview.lessons.empty}</Text>
          )}
          {upcomingLessons.map(({ lesson, period }) => {
            const subject = findById(subjects, lesson.subjectId);
            return (
              <RowActions key={lesson.id} menu={lessonActions(lesson.subjectId)}>
                <NavigationRow
                  onPress={() => openSubject(lesson.subjectId)}
                  leading={<SubjectDot color={subject?.color ?? NO_SUBJECT_COLOR} />}
                  supportingText={joinDetails(periodRange(period), lesson.room)}>
                  {t.overview.lessons.row({
                    number: periodNumber(periods, period.id),
                    subject: subject?.name ?? "",
                  })}
                </NavigationRow>
              </RowActions>
            );
          })}
        </FieldGroup.Section>

        <FieldGroup.Section title={t.entries.openEntries}>
          {openEntries.length === 0 && (
            <Text textStyle={{ color: ink.secondary }}>{t.overview.allDone}</Text>
          )}
          {openEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              subject={findById(subjects, entry.subjectId)}
              today={now.date}
            />
          ))}
        </FieldGroup.Section>
      </FormList>
    </Screen>
  );
}
