import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export const GITHUB_URL = "https://github.com/JaroxCraft/SchoolOS";
export const FEEDBACK_URL = "https://schoolos.jarox.dev/feedback";

export type AppInfoRow = { label: string; value: string };

// In Expo Go (or another development client) the running app is not SchoolOS itself, so its
// native version and build are not ours. The app id tells: it only matches our own builds.
// (Constants.executionEnvironment reports "bare" in Expo Go on Android.)
const ownAppId =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package;
const isDevelopmentClient = Application.applicationId !== ownAppId;

const dateFormat = new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short" });

export const appVersion = isDevelopmentClient
  ? (Constants.expoConfig?.version ?? "–")
  : (Application.nativeApplicationVersion ?? "–");

export const appBuild = isDevelopmentClient ? null : Application.nativeBuildVersion;

// "Version 1.1.0 (12)", or "Version 1.1.0 · Entwicklung" in Expo Go.
export const versionLabel = isDevelopmentClient
  ? `Version ${appVersion} · Entwicklung`
  : `Version ${appVersion}${appBuild ? ` (${appBuild})` : ""}`;

// The update info of our own builds. In Expo Go expo-updates describes Expo Go and the Metro
// bundle instead, so there is nothing meaningful to show.
const updates = isDevelopmentClient
  ? null
  : { id: Updates.updateId, channel: Updates.channel, runtime: Updates.runtimeVersion };

// The JS bundle that is running: the one embedded in the build or a downloaded update.
function updateLabel(): string {
  if (!updates) return "–";
  if (!Updates.isEnabled) return "Nicht aktiv";
  if (Updates.isEmbeddedLaunch || !updates.id) return "Im Build enthalten";
  const created = Updates.createdAt ? ` · ${dateFormat.format(Updates.createdAt)}` : "";
  return `${updates.id.slice(0, 8)}${created}`;
}

export function appInfoRows(): AppInfoRow[] {
  return [
    { label: "Version", value: appVersion },
    { label: "Build", value: appBuild ?? "–" },
    { label: "Update", value: updateLabel() },
    { label: "Channel", value: updates?.channel ?? "–" },
    { label: "Runtime", value: updates?.runtime?.slice(0, 8) ?? "–" },
    {
      label: "System",
      value: [`${Device.osName ?? ""} ${Device.osVersion ?? ""}`.trim(), Device.modelName]
        .filter(Boolean)
        .join(" · "),
    },
  ];
}

// Plain text for bug reports: one "Label: value" line per row, with full IDs.
export function appInfoText(): string {
  const rows = appInfoRows().map((row) => {
    if (row.label === "Update" && updates?.id && !Updates.isEmbeddedLaunch) {
      return `Update: ${updates.id}`;
    }
    if (row.label === "Runtime" && updates?.runtime) return `Runtime: ${updates.runtime}`;
    return `${row.label}: ${row.value}`;
  });
  return ["SchoolOS", ...rows].join("\n");
}
