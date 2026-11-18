import type { EntryType } from "@/db/schema";
import { countOf } from "@/i18n/plural";

export const entries = {
  // What an entry without a subject is shown as
  noSubject: "Allgemein",
  count: (count: number) => countOf(count, "Eintrag", "Einträge"),
  types: {
    homework: {
      label: "Hausaufgabe",
      // Not the word for "title": iOS reads that as a contact field and offers the own phone
      // number as AutoFill
      titlePlaceholder: "Aufgabe, z. B. S. 42, Nr. 3",
    },
    exam: { label: "Prüfung", titlePlaceholder: "Prüfung, z. B. Vokabeltest Unit 3" },
    presentation: {
      label: "Präsentation",
      titlePlaceholder: "Präsentation, z. B. Vortrag Klimawandel",
    },
    submission: { label: "Abgabe", titlePlaceholder: "Abgabe, z. B. Laborbericht" },
    other: { label: "Sonstiges", titlePlaceholder: "Eintrag, z. B. Exkursion" },
  } satisfies Record<EntryType, { label: string; titlePlaceholder: string }>,
  deletion: {
    title: (title: string) => `«${title}» löschen?`,
    message: "Der Eintrag wird gelöscht.",
  },
  // Done state of an entry: section titles, swipe action, checkbox
  open: "Offen",
  done: "Erledigt",
  newEntry: "Neuer Eintrag",
  add: "Eintrag hinzufügen",
  openEntries: "Offene Einträge",
  // Row details: "Homework · Maths · Mon, 3 Nov, tomorrow"
  rowDetails: ({
    type,
    subject,
    date,
    relative,
  }: {
    type: string;
    subject: string;
    date: string;
    relative: string;
  }) => `${type} · ${subject} · ${date}, ${relative}`,
  form: {
    type: "Typ",
    subject: "Fach",
    dueSection: "Termin",
    due: "Wann",
    nextLesson: (date: string) => `Nächste Lektion (${date})`,
    // When the subject has no next lesson
    tomorrow: "Morgen",
    lessonAfterNext: (date: string) => `Übernächste Lektion (${date})`,
    pickDate: "Datum wählen",
    date: "Datum",
    period: "Lektion",
    noPeriod: "Keine",
    // "1st period (08:00)"
    periodOption: ({ period, time }: { period: string; time: string }) => `${period} (${time})`,
    preparationSection: "Vorbereitung",
    topicPlaceholder: "Stoff",
    notesSection: "Notizen",
    descriptionPlaceholder: "Beschreibung",
    delete: "Eintrag löschen",
  },
  notFound: {
    title: "Eintrag nicht gefunden",
    message: "Dieser Eintrag existiert nicht mehr.",
  },
  agenda: {
    empty: {
      title: "Keine Einträge",
      message:
        "Hausaufgaben, Prüfungen, Präsentationen, Abgaben und andere Einträge erscheinen hier.",
    },
    filter: "Filter",
    type: "Typ",
    subject: "Fach",
    // iOS menu shows the long form, the Android picker the short one
    allTypes: "Alle Typen",
    allSubjects: "Alle Fächer",
    all: "Alle",
    // Active filters joined: "Exam · Maths"
    filterSummary: (parts: string[]) => parts.join(" · "),
    filtered: (filter: string) => `Gefiltert: ${filter}`,
    noMatches: (filter: string) => `Keine Einträge für «${filter}»`,
    resetFilter: "Filter zurücksetzen",
  },
};
