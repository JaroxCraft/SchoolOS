import { Column, FieldGroup, RNHostView, Row, Spacer, Text } from "@expo/ui";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, useColorScheme } from "react-native";

import { FooterText, FormList } from "@/components/form-list";
import { LabeledRow } from "@/components/labeled-row";
import { ActionRow, DestructiveRow, LinkRow, NavigationRow } from "@/components/rows";
import { resetDatabase } from "@/db/actions";
import { useInk } from "@/hooks/use-ink";
import { appInfoRows, appInfoText, GITHUB_URL, versionLabel } from "@/lib/app-info";
import { confirm } from "@/lib/confirm";
import { typography } from "@/lib/typography";

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

// Deletes everything and starts over like a new installation, e.g. before handing on the phone or
// to set up again from a classmate's timetable. Kept at the end of "Über SchoolOS", out of the
// way of the everyday settings.
function confirmReset() {
  confirm({
    title: "App zurücksetzen?",
    message:
      "Stundenplan, Fächer, Lehrpersonen, Einträge, Noten und Einstellungen werden gelöscht. Sichere vorher ein Backup, wenn du die Daten behalten möchtest.",
    confirmLabel: "Zurücksetzen",
    onConfirm: () => {
      resetDatabase();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Back to the existing tabs, popping their stacks; replace would put a second set of tabs
      // on top of the old ones
      router.dismissTo("/");
    },
  });
}

export default function AboutScreen() {
  const ink = useInk();
  const dark = useColorScheme() === "dark";
  // The copy row confirms with "Kopiert" for a moment. Kept in the screen so the row stays a
  // direct <ActionRow> of its section (Android would otherwise wrap it as a small text button).
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copyInfo = async () => {
    await Clipboard.setStringAsync(appInfoText());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
  };

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
              <Text {...typography("title2", { color: ink.label, bold: true })}>SchoolOS</Text>
              <Text {...typography("footnote", { color: ink.secondary })}>{versionLabel}</Text>
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
          <ActionRow label={copied ? "Kopiert ✓" : "Infos kopieren"} onPress={copyInfo} />
        </FieldGroup.Section>

        <FieldGroup.Section>
          <DestructiveRow label="App zurücksetzen" onPress={confirmReset} />
          <FieldGroup.SectionFooter>
            <FooterText>
              Löscht alle Daten auf diesem Gerät. Die App ist danach wie frisch installiert.
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
