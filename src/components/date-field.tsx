import { Button } from "@expo/ui";
import { DatePickerDialog, TimePickerDialog } from "@expo/ui/jetpack-compose";
import { useState } from "react";

import { LabeledRow } from "@/components/labeled-row";
import { t } from "@/i18n";
import { type ClockTime, dateToTime, formatDate, type IsoDate } from "@/lib/dates";

export type DateFieldProps = {
  label: string;
  // An IsoDate in date mode, a ClockTime in time mode
  value: IsoDate | ClockTime;
  onChange: (value: IsoDate | ClockTime) => void;
  mode?: "date" | "time";
};

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
            // The Material picker returns UTC midnight, so the UTC date is the picked day
            onChange(date.toISOString().slice(0, 10));
          }}
          confirmButtonLabel={t.common.ok}
          dismissButtonLabel={t.common.cancel}
          onDismissRequest={() => setOpen(false)}
        />
      )}
      {open && mode === "time" && (
        <TimePickerDialog
          initialDate={`2000-01-01T${value}:00`}
          is24Hour
          onDateSelected={(date) => {
            setOpen(false);
            onChange(dateToTime(date));
          }}
          confirmButtonLabel={t.common.ok}
          dismissButtonLabel={t.common.cancel}
          onDismissRequest={() => setOpen(false)}
        />
      )}
    </LabeledRow>
  );
}
