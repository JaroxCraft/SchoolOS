import { countOf } from "@/i18n/plural";

const periodCount = (count: number) => countOf(count, "Lektionszeit", "Lektionszeiten");
const lessonCount = (count: number) => countOf(count, "Lektion", "Lektionen");

// Periods, subjects, teachers and the timetable
export const school = {
  counts: {
    periods: periodCount,
    periodsPerDay: (count: number) => `${periodCount(count)} pro Tag`,
    subjects: (count: number) => countOf(count, "Fach", "Fächer"),
    teachers: (count: number) => countOf(count, "Lehrperson", "Lehrpersonen"),
    lessons: lessonCount,
    lessonsPerWeek: (count: number) => `${lessonCount(count)} pro Woche`,
  },
  subjectDeletion: {
    title: (name: string) => `«${name}» löschen?`,
    message:
      "Die Lektionen und Noten des Fachs werden gelöscht. Einträge bleiben und erscheinen unter «Allgemein».",
  },
  teacherDeletion: {
    title: (name: string) => `«${name}» löschen?`,
    message: "Die Fächer dieser Lehrperson bleiben bestehen, aber ohne Lehrperson.",
  },
  period: {
    // "3rd period"
    label: (number: number) => `${number}. Lektion`,
    // Two periods in a row: "3rd and 4th period"
    pair: ({ first, last }: { first: number; last: number }) => `${first}. und ${last}. Lektion`,
    // Three or more periods in a row: "3rd–5th period"
    range: ({ first, last }: { first: number; last: number }) => `${first}.–${last}. Lektion`,
    // "Monday, 3rd period"
    onWeekday: ({ weekday, period }: { weekday: string; period: string }) =>
      `${weekday}, ${period}`,
  },
  // The steps of setting up the school, in the setup checklist and where one is still missing
  setupSteps: {
    periods: "Lektionenraster erfassen",
    subjects: "Fächer erfassen",
    timetable: "Stundenplan ausfüllen",
  },
  periodGrid: {
    title: "Lektionenraster",
    empty: "Keine Lektionszeiten",
    add: "Lektionszeit hinzufügen",
    footer:
      "Das Raster gilt für jeden Schultag. Tippe auf eine Zeit, um sie zu ändern; die Lektionszeit behält dabei ihre Länge, folgende rücken bei Überschneidung nach. Neue Lektionszeiten schliessen direkt an die letzte an.",
    removeLast: "Letzte Lektionszeit entfernen",
    removeLastConfirm: {
      title: "Letzte Lektionszeit entfernen?",
      message: (lessons: number) =>
        lessons === 1
          ? "Eine Lektion im Stundenplan zu dieser Zeit wird beim Sichern ebenfalls entfernt."
          : `${lessons} Lektionen im Stundenplan zu dieser Zeit werden beim Sichern ebenfalls entfernt.`,
    },
  },
  subjects: {
    title: "Fächer",
    empty: "Keine Fächer",
    add: "Fach hinzufügen",
  },
  subjectForm: {
    newTitle: "Neues Fach",
    namePlaceholder: "Name, z. B. Mathematik",
    abbreviationExample: "Kürzel, z. B. M",
    abbreviationFooter: "Das Kürzel erscheint im Stundenplan.",
    color: "Farbe",
    colorFooter: "Die Farbe erscheint im Stundenplan und bei den Einträgen.",
    // Android marks colors of other subjects with a dot
    colorFooterWithUsed:
      "Die Farbe erscheint im Stundenplan und bei den Einträgen. Ein Punkt markiert Farben, die schon ein anderes Fach hat.",
    delete: "Fach löschen",
    teacher: "Lehrperson",
  },
  // Names of the subject colors, read out by screen readers
  colors: {
    red: "Rot",
    orange: "Orange",
    yellow: "Gelb",
    green: "Grün",
    mint: "Mint",
    blue: "Blau",
    indigo: "Indigo",
    purple: "Violett",
    pink: "Pink",
    brown: "Braun",
  },
  // The abbreviation field while a name is entered: "Abbreviation (else «M»)"
  abbreviationPlaceholder: (suggested: string) => `Kürzel (sonst «${suggested}»)`,
  subjectPicker: {
    searchPlaceholder: "Fach oder Lehrperson suchen",
  },
  // A subject or a day without lessons
  noLessons: "Keine Lektionen",
  subjectDetail: {
    abbreviation: "Kürzel",
    teacher: "Lehrperson",
    email: "E-Mail",
    lessons: "Lektionen",
    noOpenEntries: "Keine offenen Einträge",
  },
  teachers: {
    title: "Lehrpersonen",
    empty: "Keine Lehrpersonen",
    add: "Lehrperson hinzufügen",
    newTitle: "Neue Lehrperson",
    delete: "Lehrperson löschen",
    // The choice for a subject without a teacher
    none: "Keine",
    searchPlaceholder: "Name oder Kürzel suchen",
    namePlaceholder: "Name, z. B. Julian Riegger",
    abbreviationExample: "Kürzel, z. B. JRi",
    emailPlaceholder: "E-Mail, z. B. julian.riegger@schule.ch",
  },
  searchPicker: {
    noMatches: (query: string) => `Nichts gefunden für «${query}»`,
  },
  // Editing the timetable: the lessons of each weekday
  timetableEditor: {
    room: "Zimmer",
    roomPlaceholder: (subjectAbbreviation: string) => `Zimmer für ${subjectAbbreviation}`,
    // A period without a lesson
    free: "Frei",
    chooseSubject: "Fach wählen",
    noPeriods: {
      title: "Kein Lektionenraster",
      message: "Lege zuerst fest, wann deine Lektionen beginnen und enden.",
    },
    noSubjects: {
      title: "Keine Fächer",
      message: "Erfasse zuerst deine Fächer, dann kannst du sie hier den Lektionen zuteilen.",
    },
    // "Monday · 6 lessons"
    dayTitle: ({ weekday, lessons }: { weekday: string; lessons: number }) =>
      `${weekday} · ${lessonCount(lessons)}`,
    footer:
      "Tippe auf eine Lektion, um das Fach zu wählen. Das Zimmer wird vom Fach übernommen und lässt sich darunter ändern.",
  },
  // The timetable tab
  timetable: {
    empty: {
      title: "Kein Stundenplan",
      message: "Teile deinen Fächern die Lektionen der Woche zu.",
    },
    modes: {
      day: "Tag",
      week: "Woche",
    },
    // A day in the week strip for screen readers: "Monday, today"
    dayLabel: ({ weekday, isToday }: { weekday: string; isToday: boolean }) =>
      isToday ? `${weekday}, heute` : weekday,
    // Spoken after the lesson
    lessonStates: {
      past: "vorbei",
      current: "jetzt",
    },
    // Title of a lesson's menu: "Maths · 3rd period"
    lessonMenuTitle: ({ subject, periods }: { subject: string; periods: string }) =>
      `${subject} · ${periods}`,
  },
  lessonActions: {
    showSubject: "Fach anzeigen",
    editTimetable: "Stundenplan bearbeiten",
  },
};
