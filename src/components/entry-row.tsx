import { Checkbox, ListItem, Text } from "@expo/ui";
import { router } from "expo-router";

import { SubjectDot } from "@/components/subject-dot";
import { setEntryCompleted } from "@/db/actions";
import type { Entry, Subject } from "@/db/schema";
import { formatDate, relativeDay, today } from "@/lib/dates";
import { ENTRY_TYPE_INFO, isCheckable } from "@/lib/entry-types";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { useInk } from "@/hooks/use-ink";

type EntryRowProps = {
  entry: Entry;
  subject: Subject | undefined;
};

// Homework and submissions get a checkbox, everything else the subject color.
export function EntryRow({ entry, subject }: EntryRowProps) {
  const ink = useInk();
  const checkable = isCheckable(entry.type);
  const overdue = checkable && !entry.completed && entry.date < today();
  const details = [
    ENTRY_TYPE_INFO[entry.type].label,
    subject?.name ?? "Allgemein",
    `${formatDate(entry.date)}, ${relativeDay(entry.date)}`,
  ].join(" · ");

  return (
    <ListItem
      // Android: same background as the other rows of the section
      colors={{ containerColor: "transparent" }}
      onPress={() => router.push({ pathname: "/entry/[id]", params: { id: String(entry.id) } })}
      leading={
        checkable ? (
          <Checkbox
            value={entry.completed}
            onValueChange={(completed) => setEntryCompleted(entry.id, completed)}
          />
        ) : (
          <SubjectDot color={subject?.color ?? NEUTRAL_COLOR} />
        )
      }
      supportingText={
        <Text textStyle={{ color: overdue ? ink.danger : ink.secondary, fontSize: 13 }}>
          {details}
        </Text>
      }>
      {entry.title}
    </ListItem>
  );
}
