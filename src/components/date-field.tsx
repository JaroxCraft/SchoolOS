import { Button } from "@expo/ui";
import { DatePickerDialog, TimePickerDialog } from "@expo/ui/jetpack-compose";
import { useState } from "react";

import { LabeledRow } from "@/components/labeled-row";
import { formatDate } from "@/lib/dates";

export type DateFieldProps = {
  label: string;
  // ISO date ("2026-11-02") in date mode, "HH:MM" in time mode
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "time";
};

const pad = (value: number) => String(value).padStart(2, "0");

// Android: a row that opens the Material date or time dialog.
export function DateField({ label, value, onChange, mode = "date" }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <LabeledRow label={label}>
      <Button
        variant="text"
        label={mode === "date" ? formatDate(value) : value}
        onPress={() => setOpen(true)}
      />
      {open && mode === "date" && (
        <DatePickerDialog
          // The Material picker works with UTC midnight
          initialDate={`${value}T00:00:00Z`}
          showVariantToggle={false}
          onDateSelected={(date) => {
            setOpen(false);
            onChange(
              `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
            );
          }}
          onDismissRequest={() => setOpen(false)}
        />
      )}
      {open && mode === "time" && (
        <TimePickerDialog
          initialDate={`2000-01-01T${value}:00`}
          is24Hour
          onDateSelected={(date) => {
            setOpen(false);
            onChange(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
          }}
          onDismissRequest={() => setOpen(false)}
        />
      )}
    </LabeledRow>
  );
}
