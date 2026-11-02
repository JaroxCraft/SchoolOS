import { Button, FieldGroup, ListItem } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormFooter, FormList } from "@/components/form-list";
import { addPeriod } from "@/db/actions";
import { usePeriods } from "@/db/queries";
import { addMinutes } from "@/lib/dates";
import { periodRange } from "@/lib/schedule";

const LESSON_MINUTES = 50;
const FIRST_START = "07:25";

export default function PeriodsScreen() {
  const periods = usePeriods();

  const add = () => {
    const last = periods.at(-1);
    const start = last ? last.endTime : FIRST_START;
    addPeriod(start, addMinutes(start, LESSON_MINUTES));
  };

  return (
    <>
      <Stack.Title>Lektionenraster</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          {periods.map((period, index) => (
            <ListItem
              key={period.id}
              onPress={() =>
                router.push({
                  pathname: "/settings/period/[id]",
                  params: { id: String(period.id) },
                })
              }
              supportingText={periodRange(period)}>
              {`${index + 1}. Lektion`}
            </ListItem>
          ))}
          <Button variant="text" label="Lektion hinzufügen" onPress={add} />
          <FormFooter>
            Das Raster gilt für jeden Schultag. Neue Lektionen schliessen direkt an die letzte an.
          </FormFooter>
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
