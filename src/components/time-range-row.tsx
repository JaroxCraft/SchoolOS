import { Button, Row, Spacer, Text } from "@expo/ui";
import { TimePickerDialog } from "@expo/ui/jetpack-compose";
import { useState } from "react";

import { useInk } from "@/hooks/use-ink";
import { type ClockTime, dateToTime } from "@/lib/dates";

export type TimeRangeRowProps = {
  label: string;
  start: ClockTime;
  end: ClockTime;
  onChange: (start: ClockTime, end: ClockTime) => void;
};

export function TimeRangeRow({ label, start, end, onChange }: TimeRangeRowProps) {
  const ink = useInk();
  const [editing, setEditing] = useState<"start" | "end" | null>(null);

  return (
    <Row alignment="center">
      <Text textStyle={{ color: ink.label }}>{label}</Text>
      <Spacer flexible />
      <Button variant="text" label={start} onPress={() => setEditing("start")} />
      <Text textStyle={{ color: ink.secondary }}>–</Text>
      <Button variant="text" label={end} onPress={() => setEditing("end")} />
      {editing && (
        <TimePickerDialog
          initialDate={`2000-01-01T${editing === "start" ? start : end}:00`}
          is24Hour
          onDateSelected={(date) => {
            setEditing(null);
            const time = dateToTime(date);
            if (editing === "start") onChange(time, end);
            else onChange(start, time);
          }}
          confirmButtonLabel="OK"
          dismissButtonLabel="Abbrechen"
          onDismissRequest={() => setEditing(null)}
        />
      )}
    </Row>
  );
}
