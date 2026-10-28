import { FieldGroup, ListItem } from "@expo/ui";
import { router, Stack } from "expo-router";
import { Platform } from "react-native";

import { FormFooter, FormList } from "@/components/form-list";
import { SelectRow } from "@/components/select-row";
import { updateSettings } from "@/db/actions";
import { useLessons, usePeriods, useSettings, useSubjects, useTeachers } from "@/db/queries";

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
        <FieldGroup.Section title="Schule">
          <ListItem
            onPress={() => router.push("/settings/periods")}
            supportingText={`${periods.length} Lektionen pro Tag`}>
            Lektionenraster
          </ListItem>
          <ListItem
            onPress={() => router.push("/settings/subjects")}
            supportingText={`${subjects.length} Fächer`}>
            Fächer
          </ListItem>
          <ListItem
            onPress={() => router.push("/settings/teachers")}
            supportingText={`${teachers.length} Lehrpersonen`}>
            Lehrpersonen
          </ListItem>
          <ListItem
            onPress={() => router.push("/settings/timetable")}
            supportingText={`${lessons.length} Lektionen pro Woche`}>
            Stundenplan
          </ListItem>
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
          <FormFooter>
            Wie viele Tage vor dem Termin das Lernen beginnt. Lässt sich bei jedem Eintrag anpassen.
          </FormFooter>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
