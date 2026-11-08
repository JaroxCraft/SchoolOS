import { FieldGroup, Text } from "@expo/ui";
import { Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { useInk } from "@/hooks/use-ink";

const SECTIONS = [
  {
    title: "Deine Daten",
    text: "Stundenplan, Einträge und Noten werden nur auf deinem Gerät gespeichert. Es gibt kein Konto und keine Cloud.",
  },
  {
    title: "Mitteilungen",
    text: "Erinnerungen werden auf dem Gerät geplant. Dafür werden keine Daten an einen Server gesendet.",
  },
  {
    title: "Teilen und Backups",
    text: "Daten verlassen dein Gerät nur, wenn du eine Datei teilst (Stundenplan teilen oder Backup sichern). Sie geht dann über das Teilen-Menü an wen oder wohin du wählst.",
  },
  {
    title: "App-Updates",
    text: "Die App sucht bei Expo (Server in den USA) nach Updates. Dabei werden eine zufällige Installations-ID (EAS-Client-ID), die App-Version und die Plattform übertragen sowie, wie bei jeder Verbindung, deine IP-Adresse. Inhalte aus der App werden nie gesendet.",
  },
];

export default function PrivacyScreen() {
  const ink = useInk();

  return (
    <>
      <Stack.Title>Datenschutz</Stack.Title>
      <FormList>
        {SECTIONS.map((section) => (
          <FieldGroup.Section key={section.title} title={section.title}>
            <Text textStyle={{ color: ink.label, lineHeight: 22 }}>{section.text}</Text>
          </FieldGroup.Section>
        ))}
      </FormList>
    </>
  );
}
