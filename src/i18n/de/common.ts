// Words used all over the app: buttons, answers, the tabs
export const common = {
  appName: "SchoolOS",
  ok: "OK",
  cancel: "Abbrechen",
  save: "Sichern",
  next: "Weiter",
  finish: "Fertig",
  close: "Schliessen",
  add: "Hinzufügen",
  edit: "Bearbeiten",
  delete: "Löschen",
  remove: "Entfernen",
  yes: "Ja",
  no: "Nein",
  // Joins the details of a row: "M · Julian Riegger"
  detailSeparator: " · ",
  // "Maths, German and English"
  list: (parts: string[]) =>
    parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} und ${parts.at(-1)}`,
  // A name in a sentence: Delete «Maths»?
  quoted: (text: string) => `«${text}»`,
  tabs: {
    overview: "Übersicht",
    timetable: "Stundenplan",
    agenda: "Agenda",
  },
  settingsButton: "Einstellungen",
  discard: {
    title: "Änderungen verwerfen?",
    message: "Deine Eingaben sind noch nicht gesichert.",
    confirm: "Änderungen verwerfen",
  },
  saveFailed: {
    title: "Sichern nicht möglich",
    message: "Die Eingaben konnten nicht gesichert werden. Versuche es noch einmal.",
  },
  database: {
    failed: "Datenbank konnte nicht geladen werden",
    brokenReferences: (count: number) => `${count} Verweise in der Datenbank zeigen ins Leere.`,
  },
};
