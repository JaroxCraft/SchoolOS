import { Column, FieldGroup, RNHostView, Row, Spacer, Text } from "@expo/ui";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, useColorScheme } from "react-native";

import { DestructiveButton } from "@/components/destructive-button";
import { FooterText, FormList } from "@/components/form-list";
import { LabeledRow } from "@/components/labeled-row";
import { ActionRow, LinkRow, NavigationRow } from "@/components/rows";
import { clearDatabase, initDatabase } from "@/db/actions";
import { useInk } from "@/hooks/use-ink";
import { appInfoRows, appInfoText, GITHUB_URL, versionLabel } from "@/lib/app-info";
import { confirm } from "@/lib/confirm";

// iOS: the home screen icon as rendered by Apple (Liquid Glass, light only, already shaped).
// Android: the generated icon in the current appearance, rounded here.
const IOS_ICON = require("@/assets/images/icon-ios.png");
const ANDROID_ICONS = {
  light: require("@/assets/images/icon.png"),
  dark: require("@/assets/images/icon-dark.png"),
};
const ICON_SIZE = 80;

// How long the button shows "Kopiert" after copying
const COPIED_MS = 2000;

// Copies the technical info; the label confirms it for a moment, with a success haptic.
function CopyInfoRow() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(appInfoText());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
  };

  return <ActionRow label={copied ? "Kopiert ✓" : "Infos kopieren"} onPress={copy} />;
}

// Deletes everything and starts over like a new installation, e.g. before handing on the phone or
// to set up again from a classmate's timetable. Kept at the end of "Über SchoolOS", out of the
// way of the everyday settings.
function confirmReset() {
  confirm({
    title: "App zurücksetzen?",
    message:
      "Stundenplan, Fächer, Lehrpersonen, Einträge, Noten und Einstellungen werden gelöscht. Sichere vorher ein Backup, wenn du die Daten behalten möchtest.",
    confirmLabel: "Zurücksetzen",
    onConfirm: async () => {
      await clearDatabase();
      await initDatabase();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    },
  });
}

export default function AboutScreen() {
  const ink = useInk();
  const dark = useColorScheme() === "dark";
  const appIcon =
    Platform.OS === "ios" ? (
      <Image source={IOS_ICON} style={{ width: ICON_SIZE, height: ICON_SIZE }} />
    ) : (
      <Image
        source={ANDROID_ICONS[dark ? "dark" : "light"]}
        style={{ width: ICON_SIZE, height: ICON_SIZE, borderRadius: 18 }}
      />
    );

  return (
    <>
      <Stack.Title>Über SchoolOS</Stack.Title>

      <FormList>
        <FieldGroup.Section>
          <Row alignment="center">
            <Spacer flexible />
            <Column alignment="center" spacing={6} style={{ paddingVertical: 12 }}>
              <RNHostView matchContents>{appIcon}</RNHostView>
              <Text textStyle={{ color: ink.label, fontSize: 22, fontWeight: "700" }}>
                SchoolOS
              </Text>
              <Text textStyle={{ color: ink.secondary, fontSize: 13 }}>{versionLabel}</Text>
            </Column>
            <Spacer flexible />
          </Row>
        </FieldGroup.Section>

        <FieldGroup.Section title="Links">
          <LinkRow
            icon={{ sf: "chevron.left.forwardslash.chevron.right", md: "code", color: "#1C1C1E" }}
            url={GITHUB_URL}
            supportingText="GitHub">
            Quellcode
          </LinkRow>
          <LinkRow
            icon={{ sf: "bubble.left", md: "chat_bubble", color: "#007AFF" }}
            url={`${GITHUB_URL}/issues`}
            supportingText="Fehler melden oder Ideen vorschlagen">
            Feedback
          </LinkRow>
          <NavigationRow
            icon={{ sf: "hand.raised", md: "privacy_tip", color: "#5856D6" }}
            onPress={() => router.push("/settings/privacy")}>
            Datenschutz
          </NavigationRow>
        </FieldGroup.Section>

        <FieldGroup.Section title="Technische Infos">
          {appInfoRows().map((row) => (
            <LabeledRow key={row.label} label={row.label}>
              <Text textStyle={{ color: ink.secondary }}>{row.value}</Text>
            </LabeledRow>
          ))}
          <CopyInfoRow />
        </FieldGroup.Section>

        <FieldGroup.Section>
          <DestructiveButton label="App zurücksetzen" onPress={confirmReset} />
          <FieldGroup.SectionFooter>
            <FooterText>
              Löscht alle Daten auf diesem Gerät. Die App ist danach wie frisch installiert, mit dem
              Standard-Lektionenraster.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
