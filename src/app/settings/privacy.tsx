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
    title: "App-Updates",
    text: "Die App lädt Updates von den Servern von Expo. Dabei werden technische Angaben wie Version und Plattform übertragen, aber keine Inhalte aus der App.",
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
