import { DatePicker } from "@expo/ui/swift-ui";

import type { DateFieldProps } from "@/components/date-field";
import { dateToTime, parseISODate, timeToDate, toISODate } from "@/lib/dates";

export function DateField({ label, value, onChange, mode = "date" }: DateFieldProps) {
  return (
    <DatePicker
      title={label}
      selection={mode === "date" ? parseISODate(value) : timeToDate(value)}
      displayedComponents={[mode === "date" ? "date" : "hourAndMinute"]}
      onDateChange={(date) => onChange(mode === "date" ? toISODate(date) : dateToTime(date))}
    />
  );
}
