export const settings = {
  title: "Einstellungen",
  school: {
    title: "Schule",
  },
  share: {
    title: "Teilen",
    footer:
      "Schick deiner Klasse Lektionenraster, Fächer, Lehrpersonen und Stundenplan als Datei, damit niemand alles von Hand erfassen muss. Einträge und Noten bleiben privat. Importieren lassen sich nur Stundenplan- und Backup-Dateien von SchoolOS (JSON), keine PDFs oder Bilder.",
  },
  notifications: {
    title: "Mitteilungen",
    reminders: "Erinnerungen",
    secondReminder: "Zweite Erinnerung",
    noLessonSummary: "Zusammenfassung an freien Tagen",
    // `time`: when the summary comes on days without lessons, e.g. "16:00"
    footerOn: ({ minutes, time }: { minutes: number; time: string }) =>
      `${minutes} Minuten nach der letzten Lektion kommt eine Zusammenfassung von allem, was bis zum nächsten Schultag ansteht: Hausaufgaben, Prüfungen, Präsentationen, Abgaben und andere Einträge. An freien Tagen kommt sie um ${time}. Die zweite Erinnerung wiederholt das am Abend, solange noch etwas offen ist.`,
    footerDenied:
      "Mitteilungen sind für SchoolOS in den Systemeinstellungen ausgeschaltet. Beim Einschalten öffnen sich die Einstellungen, um sie zu erlauben.",
    footerOff: "Keine Erinnerungen an Hausaufgaben, Prüfungen und andere Einträge.",
  },
  backup: {
    title: "Backup",
    footer:
      "Sichert alle Daten in einer Datei, zum Beispiel für ein neues Gerät. Wiederherstellen mit «Datei importieren».",
  },
  info: {
    title: "Info",
  },
  // Only shown in development builds
  developer: {
    title: "Entwicklung: Erinnerungen",
    nothingScheduled: "Keine Mitteilungen geplant",
    scheduledAt: ({ date, time, title }: { date: string; time: string; title: string }) =>
      `${date} ${time} · ${title}`,
    scheduledNow: (title: string) => `Gleich · ${title}`,
    sendNext: "Nächste in 10 s senden",
    refresh: "Liste aktualisieren",
    footer:
      "Nur in der Entwicklung sichtbar. Die Kopie kommt nach 10 Sekunden, auch bei offener App; zum Prüfen des Antippens die App vorher in den Hintergrund schicken. Jede Änderung der Daten plant neu und verwirft die Kopie.",
  },
  about: {
    title: "Über SchoolOS",
    links: "Links",
    website: "Website",
    feedback: "Feedback",
    technicalInfo: "Technische Infos",
    copyInfo: "Infos kopieren",
    copied: "Kopiert ✓",
    reset: "App zurücksetzen",
    resetFooter: "Löscht alle Daten auf diesem Gerät. Die App ist danach wie frisch installiert.",
    resetConfirm: {
      title: "App zurücksetzen?",
      message:
        "Stundenplan, Fächer, Lehrpersonen, Einträge, Noten und Einstellungen werden gelöscht. Sichere vorher ein Backup, wenn du die Daten behalten möchtest.",
      confirm: "Zurücksetzen",
    },
  },
  // The technical infos in "About SchoolOS", also copied as text
  appInfo: {
    // A value that is not known
    unknown: "–",
    version: (version: string) => `Version ${version}`,
    versionWithBuild: ({ version, build }: { version: string; build: string }) =>
      `Version ${version} (${build})`,
    // The app runs in Expo Go or another development client
    versionInDevelopment: (version: string) => `Version ${version} · Entwicklung`,
    rows: {
      version: "Version",
      build: "Build",
      update: "Update",
      channel: "Channel",
      runtime: "Runtime",
      system: "System",
    },
    updateInactive: "Nicht aktiv",
    updateEmbedded: "Im Build enthalten",
    // `id`: the start of the update ID, `date`: when it was published
    updateWithDate: ({ id, date }: { id: string; date: string }) => `${id} · ${date}`,
    // A line of the copied text: "Version: 1.2.0"
    copyLine: ({ label, value }: { label: string; value: string }) => `${label}: ${value}`,
  },
  privacy: {
    title: "Datenschutz",
    sections: [
      {
        title: "Deine Daten",
        text: "Stundenplan, Einträge und Noten werden nur auf deinem Gerät gespeichert. Es gibt kein Konto und keine Cloud.",
      },
      {
        title: "Mitteilungen",
        text: "Erinnerungen werden auf dem Gerät geplant. Dafür werden keine Daten an einen Server gesendet.",
      },
      {
        title: "Teilen und Backups",
        text: "Daten verlassen dein Gerät nur, wenn du eine Datei teilst (Stundenplan teilen oder Backup sichern). Sie geht dann über das Teilen-Menü an wen oder wohin du wählst.",
      },
      {
        title: "App-Updates",
        text: "Die App sucht bei Expo (Server in den USA) nach Updates. Dabei werden eine zufällige Installations-ID (EAS-Client-ID), die App-Version und die Plattform übertragen sowie, wie bei jeder Verbindung, deine IP-Adresse. Inhalte aus der App werden nie gesendet.",
      },
    ],
  },
};
