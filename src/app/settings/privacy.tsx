import { FieldGroup, Text } from "@expo/ui";
import { Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { useInk } from "@/hooks/use-ink";
import { t } from "@/i18n";

export default function PrivacyScreen() {
  const ink = useInk();

  return (
    <>
      <Stack.Title>{t.settings.privacy.title}</Stack.Title>
      <FormList>
        {t.settings.privacy.sections.map((section) => (
          <FieldGroup.Section key={section.title} title={section.title}>
            <Text textStyle={{ color: ink.label, lineHeight: 22 }}>{section.text}</Text>
          </FieldGroup.Section>
        ))}
      </FormList>
    </>
  );
}
