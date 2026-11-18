import { Row, Spacer, Text } from "@expo/ui";
import { DatePicker } from "@expo/ui/swift-ui";
import { labelsHidden } from "@expo/ui/swift-ui/modifiers";

import { APP_LOCALE } from "@/components/date-field.ios";
import type { TimeRangeRowProps } from "@/components/time-range-row";
import { useInk } from "@/hooks/use-ink";
import { dateToTime, timeToDate } from "@/lib/dates";

const PICKER_MODIFIERS = [labelsHidden(), APP_LOCALE];

export function TimeRangeRow({ label, start, end, onChange }: TimeRangeRowProps) {
  const ink = useInk();

  return (
    <Row alignment="center" spacing={6}>
      <Text textStyle={{ color: ink.label }}>{label}</Text>
      <Spacer flexible />
      <DatePicker
        selection={timeToDate(start)}
        displayedComponents={["hourAndMinute"]}
        onDateChange={(date) => onChange(dateToTime(date), end)}
        modifiers={PICKER_MODIFIERS}
      />
      <Text textStyle={{ color: ink.secondary }}>–</Text>
      <DatePicker
        selection={timeToDate(end)}
        displayedComponents={["hourAndMinute"]}
        onDateChange={(date) => onChange(start, dateToTime(date))}
        modifiers={PICKER_MODIFIERS}
      />
    </Row>
  );
}
