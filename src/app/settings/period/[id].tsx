import { FieldGroup } from "@expo/ui";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";

import { DateField } from "@/components/date-field";
import { DestructiveButton } from "@/components/destructive-button";
import { FormList } from "@/components/form-list";
import { deletePeriod, updatePeriod } from "@/db/actions";
import { usePeriods } from "@/db/queries";

export default function PeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const periods = usePeriods();
  const index = periods.findIndex((period) => String(period.id) === id);
  const period = periods[index];

  if (!period) return null;

  const remove = () =>
    Alert.alert(
      "Lektion löschen?",
      "Die Lektionen im Stundenplan zu dieser Zeit werden ebenfalls entfernt.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            router.back();
            await deletePeriod(period.id);
          },
        },
      ]
    );

  return (
    <>
      <Stack.Title>{`${index + 1}. Lektion`}</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          <DateField
            label="Beginn"
            mode="time"
            value={period.startTime}
            onChange={(startTime) => updatePeriod(period.id, startTime, period.endTime)}
          />
          <DateField
            label="Ende"
            mode="time"
            value={period.endTime}
            onChange={(endTime) => updatePeriod(period.id, period.startTime, endTime)}
          />
        </FieldGroup.Section>
        <FieldGroup.Section>
          <DestructiveButton label="Lektion löschen" onPress={remove} />
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
