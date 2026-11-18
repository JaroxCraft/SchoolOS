import { school } from "@/i18n/de/school";

// The overview tab: next lessons, open entries and the setup checklist
export const overview = {
  setup: {
    title: "Einrichten",
    periods: {
      empty: "Wann deine Lektionen beginnen und enden",
      // "8 periods, 07:25–15:00"
      detail: ({ count, start, end }: { count: number; start: string; end: string }) =>
        `${school.counts.periods(count)}, ${start}–${end}`,
    },
    subjects: {
      empty: "Mit Kürzel und Farbe",
    },
    timetable: {
      detail: "Welches Fach du wann hast",
    },
    footer: "Danach zeigt die Übersicht deine nächsten Lektionen und alle offenen Einträge.",
  },
  importShortcut: {
    title: "Schneller",
    action: "Stundenplan importieren",
    footer:
      "Hat jemand aus deiner Klasse SchoolOS schon eingerichtet? Unter Einstellungen › Teilen lässt sich der Stundenplan als Datei schicken. Importieren lassen sich nur solche SchoolOS-Dateien (JSON), keine PDFs oder Bilder eines Stundenplans.",
  },
  lessons: {
    title: "Lektionen",
    // "Lessons tomorrow, Tue, 3 Nov"
    titleOn: ({ day, date }: { day: string; date: string }) => `Lektionen ${day}, ${date}`,
    empty: "Keine Lektionen im Stundenplan",
    // "3. Maths": period number and subject
    row: ({ number, subject }: { number: number; subject: string }) => `${number}. ${subject}`,
  },
  // Nothing open
  allDone: "Alles erledigt",
};
