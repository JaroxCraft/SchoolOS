// Indexed like Date.getDay() and getMonth(): Sunday first, January first
export const dates = {
  weekdays: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  weekdaysShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  monthsShort: [
    "Jan.",
    "Feb.",
    "März",
    "Apr.",
    "Mai",
    "Juni",
    "Juli",
    "Aug.",
    "Sept.",
    "Okt.",
    "Nov.",
    "Dez.",
  ],
  // "Mon, 2 Nov"
  date: ({ weekday, day, month }: { weekday: string; day: number; month: string }) =>
    `${weekday}, ${day}. ${month}`,
  // "07:25–08:15"
  timeRange: (start: string, end: string) => `${start}–${end}`,
  today: "heute",
  tomorrow: "morgen",
  yesterday: "gestern",
  inDays: (days: number) => `in ${days} Tagen`,
  daysAgo: (days: number) => `vor ${days} Tagen`,
};
