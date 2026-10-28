import { router } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";

import { NEW_ENTRY } from "@/lib/routes";

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(overview)">
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="dashboard" />
        <NativeTabs.Trigger.Label>Übersicht</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="timetable">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_view_week" />
        <NativeTabs.Trigger.Label>Stundenplan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agenda">
        <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
        <NativeTabs.Trigger.Label>Agenda</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grades">
        <NativeTabs.Trigger.Icon sf="graduationcap" md="school" />
        <NativeTabs.Trigger.Label>Noten</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* iOS: "+" on its own circle next to the tab bar (search placement from iOS 26.1, own
          surface from iOS 27). It is disabled, so tapping it only opens a new entry.
          Android uses the floating action button instead. */}
      <NativeTabs.Trigger
        name="add"
        role="search"
        prominent
        disabled
        hidden={Platform.OS !== "ios"}
        accessibilityLabel="Neuer Eintrag"
        listeners={{ tabPress: () => router.push(NEW_ENTRY) }}>
        <NativeTabs.Trigger.Icon sf="plus" md="add" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
