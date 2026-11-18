import { t } from "@/i18n";

// Joins the details of a row with " · ", skipping empty ones. Nothing left gives undefined, so a
// row without details gets no empty second line (Android keeps one for an empty string).
export function joinDetails(...parts: (string | null | undefined)[]): string | undefined {
  return parts.filter(Boolean).join(t.common.detailSeparator) || undefined;
}

export const subjectAbbreviation = (name: string) => name.trim().slice(0, 3).trim();

export function teacherAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return subjectAbbreviation(name);
  return words[0].charAt(0).toUpperCase() + words.at(-1)!.slice(0, 2);
}
