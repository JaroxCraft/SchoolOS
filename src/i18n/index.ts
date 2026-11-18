import { de } from "@/i18n/de";

// Every text the app shows, by area: t.entries.deleteTitle(entry.title). Texts with values are
// functions, so each language places the values where its grammar needs them. Another language gets
// a folder next to de/ with the same shape (`satisfies Messages`, so nothing is missing) and is
// picked here once at startup, e.g. by getLocales() of expo-localization.
export type Messages = typeof de;

export const t: Messages = de;
