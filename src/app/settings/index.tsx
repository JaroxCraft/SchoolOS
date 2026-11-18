import { FieldGroup, ListItem, Switch } from "@expo/ui";
import { router, Stack } from "expo-router";
import { Platform } from "react-native";

import { DateField } from "@/components/date-field";
import { FooterText, FormList } from "@/components/form-list";
import { ActionRow, NavigationRow } from "@/components/rows";
import { updateSettings } from "@/db/actions";
import { useLessons, usePeriods, useSettings, useSubjects, useTeachers } from "@/db/queries";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { useScheduledReminders } from "@/hooks/use-scheduled-reminders";
import { t } from "@/i18n";
import { versionLabel } from "@/lib/app-info";
import { dateToTime, formatDate, toISODate } from "@/lib/dates";
import { sendTestReminder } from "@/lib/notification-dev-tools";
import { allowNotifications } from "@/lib/notifications";
import { AFTER_SCHOOL_MINUTES } from "@/lib/reminders";
import { openScreen, SCHOOL_ROUTES } from "@/lib/routes";
import { SETUP_STEP_ICONS } from "@/lib/setup";
import { SYSTEM_COLORS } from "@/lib/system-colors";
import { pickAndImport, shareExport } from "@/lib/transfer-file";

const texts = t.settings;

export default function SettingsScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const teachers = useTeachers();
  const lessons = useLessons();
  const settings = useSettings();
  const [permission, setPermission] = useNotificationPermission();
  const reminders = useScheduledReminders();

  const denied = permission === "denied";
  const remindersOn = settings.notificationsEnabled && !denied;
  const setRemindersOn = (on: boolean) => {
    updateSettings({ notificationsEnabled: on });
    if (on && permission !== "granted") allowNotifications().then(setPermission);
  };

  const notificationsFooter = notificationsFooterText(
    remindersOn,
    denied,
    settings.noLessonSummaryTime
  );

  return (
    <>
      <Stack.Title>{texts.title}</Stack.Title>
      {/* Android closes the settings with the back arrow */}
      {Platform.OS === "ios" && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button variant="done" onPress={() => router.back()}>
            {t.common.finish}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}

      <FormList>
        {/* In the order they build on each other; teachers are optional */}
        <FieldGroup.Section title={texts.school.title}>
          <NavigationRow
            icon={SETUP_STEP_ICONS.periods}
            onPress={() => openScreen(SCHOOL_ROUTES.settings.periods)}
            supportingText={t.school.counts.periodsPerDay(periods.length)}>
            {t.school.periodGrid.title}
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.subjects}
            onPress={() => openScreen(SCHOOL_ROUTES.settings.subjects)}
            supportingText={t.school.counts.subjects(subjects.length)}>
            {t.school.subjects.title}
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.timetable}
            onPress={() => openScreen(SCHOOL_ROUTES.settings.timetable)}
            supportingText={t.school.counts.lessonsPerWeek(lessons.length)}>
            {t.common.tabs.timetable}
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.teachers}
            onPress={() => openScreen("/settings/teachers")}
            supportingText={t.school.counts.teachers(teachers.length)}>
            {t.school.teachers.title}
          </NavigationRow>
        </FieldGroup.Section>

        {/* Both exports, then the import that takes either file */}
        <FieldGroup.Section title={texts.files.title}>
          <ActionRow
            icon={{ sf: "square.and.arrow.up", md: "share", color: SYSTEM_COLORS.indigo }}
            label={t.transfer.actions.timetable}
            onPress={() => shareExport("timetable")}
          />
          <ActionRow
            icon={{ sf: "externaldrive", md: "backup", color: SYSTEM_COLORS.gray }}
            label={t.transfer.actions.backup}
            onPress={() => shareExport("backup")}
          />
          <ActionRow
            icon={{ sf: "square.and.arrow.down", md: "download", color: SYSTEM_COLORS.teal }}
            label={t.transfer.actions.importFile}
            onPress={pickAndImport}
          />
          <FieldGroup.SectionFooter>
            <FooterText>{texts.files.footer}</FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title={texts.notifications.title}>
          <Switch
            label={texts.notifications.reminders}
            value={remindersOn}
            onValueChange={setRemindersOn}
          />
          {remindersOn && (
            <DateField
              mode="time"
              label={texts.notifications.secondReminder}
              value={settings.secondReminderTime}
              onChange={(secondReminderTime) => updateSettings({ secondReminderTime })}
            />
          )}
          {remindersOn && (
            <DateField
              mode="time"
              label={texts.notifications.noLessonSummary}
              value={settings.noLessonSummaryTime}
              onChange={(noLessonSummaryTime) => updateSettings({ noLessonSummaryTime })}
            />
          )}
          <FieldGroup.SectionFooter>
            <FooterText>{notificationsFooter}</FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title={texts.info.title}>
          <NavigationRow
            icon={{ sf: "info", md: "info", color: SYSTEM_COLORS.gray }}
            onPress={() => openScreen("/settings/about")}
            supportingText={versionLabel}>
            {texts.about.title}
          </NavigationRow>
        </FieldGroup.Section>

        {__DEV__ && (
          <FieldGroup.Section title={texts.developer.title}>
            {reminders.scheduled.length === 0 && (
              <ListItem>{texts.developer.nothingScheduled}</ListItem>
            )}
            {reminders.scheduled.map((reminder) => (
              // The time it is sent, then the notification as it appears
              <ListItem key={reminder.id} supportingText={`${reminder.title}\n${reminder.body}`}>
                {reminder.at
                  ? texts.developer.sendsAt({
                      date: formatDate(toISODate(reminder.at)),
                      time: dateToTime(reminder.at),
                    })
                  : texts.developer.sendsNow}
              </ListItem>
            ))}
            <ActionRow
              label={texts.developer.sendNext}
              onPress={() =>
                sendTestReminder(reminders.scheduled.find((reminder) => reminder.at)).then(
                  reminders.refresh
                )
              }
            />
            <ActionRow label={texts.developer.refresh} onPress={reminders.refresh} />
            <FieldGroup.SectionFooter>
              <FooterText>{texts.developer.footer}</FooterText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}

function notificationsFooterText(remindersOn: boolean, denied: boolean, noLessonTime: string) {
  if (remindersOn) {
    return texts.notifications.footerOn({ minutes: AFTER_SCHOOL_MINUTES, time: noLessonTime });
  }
  if (denied) return texts.notifications.footerDenied;
  return texts.notifications.footerOff;
}
