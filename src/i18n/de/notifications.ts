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
  // The last line when there are too many entries for one notification
  more: (count: number) => `und ${count} weitere`,
};
