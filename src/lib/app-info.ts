import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

import type { TransferSource } from "@/db/transfer";
import journal from "@/drizzle/meta/_journal.json";
import { t } from "@/i18n";

export const WEBSITE_URL = "https://schoolos.jarox.dev/";
export const FEEDBACK_URL = `${WEBSITE_URL}feedback/`;

// `copyValue` replaces `value` in the copied text, e.g. with the full ID
export type AppInfoRow = { label: string; value: string; copyValue?: string };

// In Expo Go (or another development client) the running app is not SchoolOS itself, so its
// native version and build are not ours. The app id tells: it only matches our own builds.
// (Constants.executionEnvironment reports "bare" in Expo Go on Android.)
const ownAppId =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package;
const isDevelopmentClient = Application.applicationId !== ownAppId;

const dateFormat = new Intl.DateTimeFormat(t.locale, { dateStyle: "medium", timeStyle: "short" });

const texts = t.settings.appInfo;

const appVersion =
  (isDevelopmentClient ? Constants.expoConfig?.version : Application.nativeApplicationVersion) ??
  null;
const shownVersion = appVersion ?? texts.unknown;

const appBuild = isDevelopmentClient ? null : Application.nativeBuildVersion;

export const versionLabel = isDevelopmentClient
  ? texts.versionInDevelopment(shownVersion)
  : appBuild
    ? texts.versionWithBuild({ version: shownVersion, build: appBuild })
    : texts.version(shownVersion);

// The update info of our own builds. In Expo Go expo-updates describes Expo Go and the Metro
// bundle instead, so there is nothing meaningful to show.
const updates = isDevelopmentClient
  ? null
  : { id: Updates.updateId, channel: Updates.channel, runtime: Updates.runtimeVersion };

function updateLabel(): string {
  if (!updates) return texts.unknown;
  if (!Updates.isEnabled) return texts.updateInactive;
  if (Updates.isEmbeddedLaunch || !updates.id) return texts.updateEmbedded;
  const id = updates.id.slice(0, 8);
  return Updates.createdAt
    ? texts.updateWithDate({ id, date: dateFormat.format(Updates.createdAt) })
    : id;
}

export function appInfoRows(): AppInfoRow[] {
  return [
    { label: texts.rows.version, value: shownVersion },
    { label: texts.rows.build, value: appBuild ?? texts.unknown },
    {
      label: texts.rows.update,
      value: updateLabel(),
      copyValue: updates?.id && !Updates.isEmbeddedLaunch ? updates.id : undefined,
    },
    { label: texts.rows.channel, value: updates?.channel ?? texts.unknown },
    {
      label: texts.rows.runtime,
      value: updates?.runtime?.slice(0, 8) ?? texts.unknown,
      copyValue: updates?.runtime || undefined,
    },
    {
      label: texts.rows.system,
      value: [`${Device.osName ?? ""} ${Device.osVersion ?? ""}`.trim(), Device.modelName]
        .filter(Boolean)
        .join(t.common.detailSeparator),
    },
  ];
}

export function appInfoText(): string {
  const rows = appInfoRows().map((row) =>
    texts.copyLine({ label: row.label, value: row.copyValue ?? row.value })
  );
  return [t.common.appName, ...rows].join("\n");
}

// The same app info for the head of a backup, plus the last database migration and the time zone
export function exportSource(): TransferSource {
  return {
    appVersion,
    build: appBuild,
    updateId: updates?.id ?? null,
    channel: updates?.channel ?? null,
    runtimeVersion: updates?.runtime ?? null,
    development: isDevelopmentClient,
    platform: Platform.OS,
    osVersion: Device.osVersion,
    device: Device.modelName,
    schema: journal.entries.at(-1)!.tag,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
