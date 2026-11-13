import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";
import { Platform } from "react-native";

import { FooterText, FormList } from "@/components/form-list";
import { ActionRow, NavigationRow } from "@/components/rows";
import { SelectRow } from "@/components/select-row";
import { updateSettings } from "@/db/actions";
import { useLessons, usePeriods, useSettings, useSubjects, useTeachers } from "@/db/queries";
import { versionLabel } from "@/lib/app-info";
import { SCHOOL_ROUTES } from "@/lib/routes";
import { SETUP_STEP_ICONS } from "@/lib/setup";
import { pickAndImport, shareExport } from "@/lib/transfer-file";

const LEAD_DAY_OPTIONS = Array.from({ length: 22 }, (_, days) => ({
  label: days === 1 ? "1 Tag" : `${days} Tage`,
  value: days,
}));

export default function SettingsScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const teachers = useTeachers();
  const lessons = useLessons();
  const settings = useSettings();

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
            onPress={() => router.push(SCHOOL_ROUTES.settings.periods)}
            supportingText={`${periods.length} Lektionen pro Tag`}>
            Lektionenraster
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.subjects}
            onPress={() => router.push(SCHOOL_ROUTES.settings.subjects)}
            supportingText={`${subjects.length} Fächer`}>
            Fächer
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.timetable}
            onPress={() => router.push(SCHOOL_ROUTES.settings.timetable)}
            supportingText={`${lessons.length} Lektionen pro Woche`}>
            Stundenplan
          </NavigationRow>
          <NavigationRow
            icon={SETUP_STEP_ICONS.teachers}
            onPress={() => router.push("/settings/teachers")}
            supportingText={`${teachers.length} Lehrpersonen`}>
            Lehrpersonen
          </NavigationRow>
        </FieldGroup.Section>

        <FieldGroup.Section title="Teilen">
          <ActionRow
            icon={{ sf: "square.and.arrow.up", md: "share", color: "#5856D6" }}
            label="Stundenplan teilen"
            onPress={() => shareExport("timetable")}
          />
          <ActionRow
            icon={{ sf: "square.and.arrow.down", md: "download", color: "#30B0C7" }}
            label="Datei importieren"
            onPress={() => pickAndImport()}
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

        <FieldGroup.Section title="Lernbeginn">
          <SelectRow
            label="Prüfung"
            value={settings.examLeadDays}
            options={LEAD_DAY_OPTIONS}
            onChange={(examLeadDays) => updateSettings({ examLeadDays })}
          />
          <SelectRow
            label="Präsentation"
            value={settings.presentationLeadDays}
            options={LEAD_DAY_OPTIONS}
            onChange={(presentationLeadDays) => updateSettings({ presentationLeadDays })}
          />
          <SelectRow
            label="Abgabe"
            value={settings.submissionLeadDays}
            options={LEAD_DAY_OPTIONS}
            onChange={(submissionLeadDays) => updateSettings({ submissionLeadDays })}
          />
          <FieldGroup.SectionFooter>
            <FooterText>
              Wie viele Tage vor dem Termin das Lernen beginnt. Lässt sich bei jedem Eintrag
              anpassen.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Backup">
          <ActionRow
            icon={{ sf: "externaldrive", md: "backup", color: "#8E8E93" }}
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
            icon={{ sf: "info", md: "info", color: "#8E8E93" }}
            onPress={() => router.push("/settings/about")}
            supportingText={versionLabel}>
            Über SchoolOS
          </NavigationRow>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
