import type { EntryType, Settings } from "@/db/schema";

type EntryTypeInfo = {
  label: string;
  // Study start and grade only apply to exams, presentations and submissions
  gradable: boolean;
};

export const ENTRY_TYPE_INFO: Record<EntryType, EntryTypeInfo> = {
  homework: { label: "Hausaufgabe", gradable: false },
  exam: { label: "Prüfung", gradable: true },
  presentation: { label: "Präsentation", gradable: true },
  submission: { label: "Abgabe", gradable: true },
  other: { label: "Sonstiges", gradable: false },
};

export function defaultLeadDays(type: EntryType, settings: Settings): number | null {
  switch (type) {
    case "exam":
      return settings.examLeadDays;
    case "presentation":
      return settings.presentationLeadDays;
    case "submission":
      return settings.submissionLeadDays;
    default:
      return null;
  }
}

// Entries that are done by the student and can be checked off
export function isCheckable(type: EntryType): boolean {
  return type === "homework" || type === "submission";
}
