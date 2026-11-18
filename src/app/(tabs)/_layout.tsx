import { NativeTabs } from "expo-router/native-tabs";

import { t } from "@/i18n";

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(overview)">
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="dashboard" />
        <NativeTabs.Trigger.Label>{t.common.tabs.overview}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(timetable)">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_view_week" />
        <NativeTabs.Trigger.Label>{t.common.tabs.timetable}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agenda">
        <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
        <NativeTabs.Trigger.Label>{t.common.tabs.agenda}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
