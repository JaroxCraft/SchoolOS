import { Row, Spacer, Text } from "@expo/ui";
import { DatePicker } from "@expo/ui/swift-ui";
import { labelsHidden } from "@expo/ui/swift-ui/modifiers";

import type { TimeRangeRowProps } from "@/components/time-range-row";
import { useInk } from "@/hooks/use-ink";
import { dateToTime, timeToDate } from "@/lib/dates";

// iOS: a label with two compact time pickers, so start and end are changed right in the list.
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
        modifiers={[labelsHidden()]}
      />
      <Text textStyle={{ color: ink.secondary }}>–</Text>
      <DatePicker
        selection={timeToDate(end)}
        displayedComponents={["hourAndMinute"]}
        onDateChange={(date) => onChange(start, dateToTime(date))}
        modifiers={[labelsHidden()]}
      />
    </Row>
  );
}
