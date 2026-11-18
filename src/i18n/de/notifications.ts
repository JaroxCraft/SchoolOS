// The school day a reminder is about. `dayName`: "tomorrow" or the weekday ("Monday"); `when`:
// "tomorrow" or "on Monday"; `When`: the same, capitalized for the start of a sentence.
type ReminderDay = { dayName: string; when: string; When: string };

// `what`: the entry, e.g. "Exam Maths «Fractions»"
type DueLine = { when: string; When: string; what: string };

export const notifications = {
  // Android shows it in the notification settings of the app
  channel: {
    name: "Erinnerungen",
    description: "Was bis zum nächsten Schultag fällig ist",
  },
  // Sent from the development tools in the settings when nothing is scheduled
  test: {
    title: "Testmitteilung",
    body: "Gerade ist keine Erinnerung geplant.",
  },
  reminders: {
    tomorrow: "morgen",
    onWeekday: (weekday: string) => `am ${weekday}`,
    // Each list holds variants; the reminders of one day use one, the next day the next
    summaryTitles: {
      homework: [
        ({ dayName }: ReminderDay) => `Für ${dayName}`,
        ({ when }: ReminderDay) => `Das steht ${when} an`,
        ({ dayName }: ReminderDay) => `Bis ${dayName} zu erledigen`,
      ],
      noHomework: [
        ({ When }: ReminderDay) => `${When} ist es so weit`,
        () => "Endspurt",
        () => "Letzte Vorbereitung",
      ],
    },
    // The evening reminder
    secondTitles: {
      homework: [
        ({ dayName }: ReminderDay) => `Noch offen für ${dayName}`,
        ({ dayName }: ReminderDay) => `Schon alles bereit für ${dayName}?`,
        ({ when }: ReminderDay) => `Zur Erinnerung: ${when}`,
      ],
      noHomework: [
        ({ dayName }: ReminderDay) => `Bereit für ${dayName}?`,
        () => "Noch einmal zur Erinnerung",
        ({ When }: ReminderDay) => `${When} gilt es`,
      ],
    },
    // One line per entry, by entry type
    dueLines: {
      exam: [
        ({ When, what }: DueLine) => `${When}: ${what} – letzte Wiederholung?`,
        ({ when, what }: DueLine) => `${what} ist ${when} – nochmals alles durchgehen?`,
        ({ When, what }: DueLine) => `${When} ist es so weit: ${what}. Du schaffst das!`,
      ],
      presentation: [
        ({ When, what }: DueLine) => `${When}: ${what} – ein letzter Durchgang?`,
        ({ when, what }: DueLine) => `${what} ist ${when} – nochmals laut üben?`,
        ({ When, what }: DueLine) => `${When} ist es so weit: ${what}. Du schaffst das!`,
      ],
      submission: [
        ({ When, what }: DueLine) => `${When}: ${what} – alles bereit?`,
        ({ when, what }: DueLine) => `${what} ist ${when} fällig – fehlt noch etwas?`,
        ({ When, what }: DueLine) => `${When} ist es so weit: ${what}. Fast geschafft!`,
      ],
      other: [
        ({ When, what }: DueLine) => `${When}: ${what}`,
        ({ when, what }: DueLine) => `Nicht vergessen: ${what} ist ${when}`,
        ({ when, what }: DueLine) => `${what} ist ${when}`,
      ],
    },
    // The entry in a due line: "Exam Maths «Fractions»"; type and subject are left out when
    // missing
    dueWhat: ({ type, subject, title }: { type?: string; subject?: string; title: string }) =>
      [type, subject, `«${title}»`].filter(Boolean).join(" "),
    // "Maths: page 12", with the due date when it is after the next school day
    homework: ({ subject, title, date }: { subject?: string; title: string; date?: string }) => {
      const line = subject ? `${subject}: ${title}` : title;
      return date ? `${line} (${date})` : line;
    },
    // The last line when there are too many entries for one notification
    more: (count: number) => `und ${count} weitere`,
  },
};
