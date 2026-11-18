import { entries } from "@/i18n/de/entries";
import { school } from "@/i18n/de/school";

// Export and import of timetable and backup files
export const transfer = {
  fileNames: {
    timetable: "SchoolOS-Stundenplan.json",
    // `date`: the day of the backup, "2026-11-18"
    backup: (date: string) => `SchoolOS-Backup-${date}.json`,
  },
  // The actions in the settings; the share sheet (Android) is titled like the action
  actions: {
    timetable: "Stundenplan teilen",
    backup: "Backup sichern",
    importFile: "Datei importieren",
  },
  shareFailed: {
    title: "Teilen nicht möglich",
    message: "Versuche es noch einmal.",
  },
  openFailed: {
    title: "Öffnen nicht möglich",
    message: "Die Datei konnte nicht geöffnet werden. Versuche es noch einmal.",
  },
  importFailed: {
    title: "Import nicht möglich",
    unreadable: "Die Datei konnte nicht gelesen werden.",
    notImported: "Die Datei konnte nicht importiert werden. Es wurde nichts geändert.",
  },
  // `contents`: what the file holds, see `contents` below
  confirmTimetable: {
    title: "Stundenplan importieren?",
    message: (contents: string) =>
      `Die Datei enthält ${contents}. Dein Lektionenraster, deine Fächer, Lehrpersonen und dein Stundenplan werden ersetzt. Einträge und Noten bleiben erhalten.`,
    confirm: "Importieren",
  },
  confirmBackup: {
    title: "Backup wiederherstellen?",
    message: (contents: string) =>
      `Die Datei enthält ${contents}. Alle Daten auf diesem Gerät werden durch das Backup ersetzt.`,
    confirm: "Wiederherstellen",
  },
  // The parts of the contents, joined to a list: "8 periods per day, 12 subjects, …"
  contents: {
    periods: school.counts.periodsPerDay,
    subjects: school.counts.subjects,
    teachers: school.counts.teachers,
    lessons: (count: number) => `${school.counts.lessons(count)} im Stundenplan`,
    entries: entries.count,
  },
  // Why a file cannot be imported. `row` names the faulty row, see `rows` below.
  errors: {
    notSchoolOSFile:
      "Die Datei ist keine SchoolOS-Datei. Importieren lassen sich nur JSON-Dateien, die SchoolOS mit «Stundenplan teilen» oder «Backup sichern» erstellt hat, keine PDFs oder Bilder.",
    invalidFormat: "Die Dateiversion ist ungültig.",
    newerFormat:
      "Die Datei stammt aus einer neueren Version von SchoolOS. Aktualisiere SchoolOS, um sie zu importieren.",
    // `list`: see `lists` below
    missingList: (list: string) => `Die Datei enthält keine ${list}.`,
    invalidRow: (row: string) => `${row} ist ungültig.`,
    // `field`: the technical name of the field in the file, e.g. "startTime"
    invalidField: ({ row, field }: { row: string; field: string }) =>
      `${row}: Die Angabe «${field}» fehlt oder ist ungültig.`,
    invalidChoice: ({ row, value, field }: { row: string; value: string; field: string }) =>
      `${row}: «${value}» ist keine gültige Angabe für «${field}».`,
    invalidId: ({ row, id }: { row: string; id: number }) => `${row}: Die ID ${id} ist ungültig.`,
    duplicateId: ({ row, id }: { row: string; id: number }) =>
      `${row}: Die ID ${id} kommt in der Datei mehrfach vor.`,
    // `what`: see `fields` below
    invalidTime: ({ row, what, value }: { row: string; what: string; value: string }) =>
      `${row}: ${what} «${value}» ist keine gültige Uhrzeit.`,
    invalidDate: ({ row, what, value }: { row: string; what: string; value: string }) =>
      `${row}: ${what} «${value}» ist kein gültiges Datum.`,
    missingReference: ({ row, what, id }: { row: string; what: string; id: number }) =>
      `${row}: ${what} mit der ID ${id} fehlt in der Datei.`,
    periodNotBeforeEnd: ({ row, start, end }: { row: string; start: string; end: string }) =>
      `${row}: Beginn ${start} liegt nicht vor dem Ende ${end}.`,
    duplicatePeriodStart: ({ row, start }: { row: string; start: string }) =>
      `${row}: Eine Lektionszeit beginnt bereits um ${start}.`,
    invalidColor: ({ row, color }: { row: string; color: string }) =>
      `${row}: Die Farbe «${color}» ist ungültig.`,
    invalidWeekday: ({ row, weekday }: { row: string; weekday: number }) =>
      `${row}: Wochentag ${weekday} gibt es nicht.`,
    duplicateLesson: (row: string) =>
      `${row}: Am selben Tag liegt zur selben Lektionszeit schon eine Lektion.`,
    gradeOutOfRange: ({ row, grade }: { row: string; grade: number }) =>
      `${row}: Die Note ${grade} liegt nicht zwischen 1 und 6.`,
  },
  // The lists of a file, as in "The file contains no subjects."
  lists: {
    periods: "Lektionszeiten",
    teachers: "Lehrpersonen",
    subjects: "Fächer",
    lessons: "Lektionen im Stundenplan",
    entries: "Einträge",
    grades: "Noten",
    semesters: "Semester",
    settings: "Einstellungen",
  },
  // A row of a list by its position in the file, starting at 1: "Subject 3"
  rows: {
    period: (position: number) => `Lektionszeit ${position}`,
    teacher: (position: number) => `Lehrperson ${position}`,
    subject: (position: number) => `Fach ${position}`,
    lesson: (position: number) => `Lektion ${position}`,
    entry: (position: number) => `Eintrag ${position}`,
    grade: (position: number) => `Note ${position}`,
    semester: (position: number) => `Semester ${position}`,
    settings: "Einstellungen",
  },
  // The subject of a sentence about a field: "Subject 3: The teacher with the ID 4 is missing …"
  fields: {
    periodStart: "Beginn",
    periodEnd: "Ende",
    teacher: "Die Lehrperson",
    subject: "Das Fach",
    period: "Die Lektionszeit",
    entry: "Der Eintrag",
    date: "Das Datum",
    semesterStart: "Der Beginn",
    semesterEnd: "Das Ende",
    secondReminder: "Die zweite Erinnerung",
    noLessonSummary: "Die Zusammenfassung an freien Tagen",
  },
};
