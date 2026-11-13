import { ENTRY_TYPES, type EntryType, type Settings } from "@/db/schema";

type EntryTypeInfo = {
  label: string;
  // Not "Titel": iOS reads that as a contact field and offers the own phone number as AutoFill
  titlePlaceholder: string;
  // Study start and grade only apply to exams, presentations and submissions
  gradable: boolean;
};

export const ENTRY_TYPE_INFO: Record<EntryType, EntryTypeInfo> = {
  homework: { label: "Hausaufgabe", titlePlaceholder: "Aufgabe", gradable: false },
  exam: { label: "Prüfung", titlePlaceholder: "Prüfung, z. B. Vokabeltest Unit 3", gradable: true },
  presentation: {
    label: "Präsentation",
    titlePlaceholder: "Präsentation, z. B. Vortrag Klimawandel",
    gradable: true,
  },
  submission: { label: "Abgabe", titlePlaceholder: "Abgabe, z. B. Laborbericht", gradable: true },
  other: { label: "Sonstiges", titlePlaceholder: "Eintrag, z. B. Exkursion", gradable: false },
};

export const ENTRY_TYPE_OPTIONS = ENTRY_TYPES.map((type) => ({
  label: ENTRY_TYPE_INFO[type].label,
  value: type,
}));

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
