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
import { versionLabel } from "@/lib/app-info";
import { dateToTime, formatDate, toISODate } from "@/lib/dates";
import { allowNotifications, sendTestReminder } from "@/lib/notifications";
import { AFTER_SCHOOL_MINUTES } from "@/lib/reminders";
import { openScreen, SCHOOL_ROUTES } from "@/lib/routes";
import { SETUP_STEP_ICONS } from "@/lib/setup";
import { SYSTEM_COLORS } from "@/lib/system-colors";
import { countOf } from "@/lib/text";
import { pickAndImport, shareExport } from "@/lib/transfer-file";

export default function SettingsScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const teachers = useTeachers();
  const lessons = useLessons();
  const settings = useSettings();
  const [permission, setPermission] = useNotificationPermission();
  const reminders = useScheduledReminders();

  // Without the system permission the switch shows off, whatever is saved: no reminder arrives.
  // Switching it on asks for the permission, or opens the system settings once the system no
  // longer shows its dialog (allowNotifications).
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
      <Stack.Title>Einstellungen</Stack.Title>
      {/* Android closes the settings with the back arrow */}
      {Platform.OS === "ios" && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button variant="done" onPress={() => router.back()}>
            Fertig
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}

      <FormList>
        {/* In the order they build on each other; teachers are optional */}
        <FieldGroup.Section title="Schule">
          <NavigationRow
            icon={SETUP_STEP_ICONS.periods}
            onPress={() => openScreen(SCHOOL_ROUTES.settings.periods)}
            supportingText={`${countOf(periods.length, "Lektionszeit", "Lektionszeiten")} pro Tag`}>
            Lektionenraster
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.subjects}
            onPress={() => openScreen(SCHOOL_ROUTES.settings.subjects)}
            supportingText={countOf(subjects.length, "Fach", "Fächer")}>
            Fächer
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.timetable}
            onPress={() => openScreen(SCHOOL_ROUTES.settings.timetable)}
            supportingText={`${countOf(lessons.length, "Lektion", "Lektionen")} pro Woche`}>
            Stundenplan
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.teachers}
            onPress={() => openScreen("/settings/teachers")}
            supportingText={countOf(teachers.length, "Lehrperson", "Lehrpersonen")}>
            Lehrpersonen
          </NavigationRow>
        </FieldGroup.Section>

        <FieldGroup.Section title="Teilen">
          <ActionRow
            icon={{ sf: "square.and.arrow.up", md: "share", color: SYSTEM_COLORS.indigo }}
            label="Stundenplan teilen"
            onPress={() => shareExport("timetable")}
          />
          <ActionRow
            icon={{ sf: "square.and.arrow.down", md: "download", color: SYSTEM_COLORS.teal }}
            label="Datei importieren"
            onPress={pickAndImport}
          />
          <FieldGroup.SectionFooter>
            <FooterText>
              Schick deiner Klasse Lektionenraster, Fächer, Lehrpersonen und Stundenplan als Datei,
              damit niemand alles von Hand erfassen muss. Einträge und Noten bleiben privat.
              Importieren lassen sich nur Stundenplan- und Backup-Dateien von SchoolOS (JSON), keine
              PDFs oder Bilder.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Mitteilungen">
          <Switch label="Erinnerungen" value={remindersOn} onValueChange={setRemindersOn} />
          {remindersOn && (
            <DateField
              mode="time"
              label="Zweite Erinnerung"
              value={settings.secondReminderTime}
              onChange={(secondReminderTime) => updateSettings({ secondReminderTime })}
            />
          )}
          {remindersOn && (
            <DateField
              mode="time"
              label="Zusammenfassung an freien Tagen"
              value={settings.noLessonSummaryTime}
              onChange={(noLessonSummaryTime) => updateSettings({ noLessonSummaryTime })}
            />
          )}
          <FieldGroup.SectionFooter>
            <FooterText>{notificationsFooter}</FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Backup">
          <ActionRow
            icon={{ sf: "externaldrive", md: "backup", color: SYSTEM_COLORS.gray }}
            label="Backup sichern"
            onPress={() => shareExport("backup")}
          />
          <FieldGroup.SectionFooter>
            <FooterText>
              Sichert alle Daten in einer Datei, zum Beispiel für ein neues Gerät. Wiederherstellen
              mit «Datei importieren».
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Info">
          <NavigationRow
            icon={{ sf: "info", md: "info", color: SYSTEM_COLORS.gray }}
            onPress={() => openScreen("/settings/about")}
            supportingText={versionLabel}>
            Über SchoolOS
          </NavigationRow>
        </FieldGroup.Section>

        {__DEV__ && (
          <FieldGroup.Section title="Entwicklung: Erinnerungen">
            {reminders.scheduled.length === 0 && <ListItem>Keine Mitteilungen geplant</ListItem>}
            {reminders.scheduled.map((reminder) => (
              <ListItem key={reminder.id} supportingText={reminder.body}>
                {reminder.at
                  ? `${formatDate(toISODate(reminder.at))} ${dateToTime(reminder.at)} · ${reminder.title}`
                  : `Gleich · ${reminder.title}`}
              </ListItem>
            ))}
            <ActionRow
              label="Nächste in 10 s senden"
              onPress={() =>
                sendTestReminder(reminders.scheduled.find((reminder) => reminder.at)).then(
                  reminders.refresh
                )
              }
            />
            <ActionRow label="Liste aktualisieren" onPress={reminders.refresh} />
            <FieldGroup.SectionFooter>
              <FooterText>
                Nur in der Entwicklung sichtbar. Die Kopie kommt nach 10 Sekunden, auch bei offener
                App; zum Prüfen des Antippens die App vorher in den Hintergrund schicken. Jede
                Änderung der Daten plant neu und verwirft die Kopie.
              </FooterText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}

function notificationsFooterText(remindersOn: boolean, denied: boolean, noLessonTime: string) {
  if (remindersOn) {
    return `${AFTER_SCHOOL_MINUTES} Minuten nach der letzten Lektion kommt eine Zusammenfassung von allem, was bis zum nächsten Schultag ansteht: Hausaufgaben, Prüfungen, Präsentationen, Abgaben und andere Einträge. An freien Tagen kommt sie um ${noLessonTime}. Die zweite Erinnerung wiederholt das am Abend, solange noch etwas offen ist.`;
  }
  if (denied) {
    return "Mitteilungen sind für SchoolOS in den Systemeinstellungen ausgeschaltet. Beim Einschalten öffnen sich die Einstellungen, um sie zu erlauben.";
  }
  return "Keine Erinnerungen an Hausaufgaben, Prüfungen und andere Einträge.";
}
