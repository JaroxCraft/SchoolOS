import { DatePicker } from "@expo/ui/swift-ui";
import { environment } from "@expo/ui/swift-ui/modifiers";

import type { DateFieldProps } from "@/components/date-field";
import { t } from "@/i18n";
import { dateToTime, parseISODate, timeToDate, toISODate } from "@/lib/dates";

// In the language of the app, like its other dates and times: "07:25" and "19. Nov. 2026" also
// on a device with an English region, which would show "7:25 AM" and "Nov 19, 2026". SwiftUI only
// takes an identifier of Locale.availableIdentifiers, written with "_" ("de_CH", not "de-CH").
export const APP_LOCALE = environment("locale", t.locale.replace("-", "_"));

export function DateField({ label, value, onChange, mode = "date" }: DateFieldProps) {
  return (
    <DatePicker
      title={label}
      selection={mode === "date" ? parseISODate(value) : timeToDate(value)}
      displayedComponents={[mode === "date" ? "date" : "hourAndMinute"]}
      onDateChange={(date) => onChange(mode === "date" ? toISODate(date) : dateToTime(date))}
      modifiers={[APP_LOCALE]}
    />
  );
}
