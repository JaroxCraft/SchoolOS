import { Text } from "@expo/ui";
import { router } from "expo-router";

import { NavigationRow, type RowComponent } from "@/components/rows";
import { SubjectDot } from "@/components/subject-dot";
import { TaskCheckbox } from "@/components/task-checkbox";
import { setEntryCompleted } from "@/db/actions";
import type { Entry, Subject } from "@/db/schema";
import { type Ink, useInk } from "@/hooks/use-ink";
import { markToggled } from "@/hooks/use-recently-completed";
import { formatDate, relativeDay, today } from "@/lib/dates";
import { ENTRY_TYPE_INFO, isCheckable } from "@/lib/entry-types";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";

type EntryRowProps = {
  entry: Entry;
  subject: Subject | undefined;
};

// Homework and submissions get a checkbox, everything else the subject color. A task checked off
// is dimmed and, like an unchecked one, stays in its place until the screen is left (see
// useWasCompleted). Built without hooks, so <FormList> can use it as the list item itself.
function entryItem({ entry, subject }: EntryRowProps, ink: Ink) {
  const checkable = isCheckable(entry.type);
  const done = checkable && entry.completed;
  const overdue = checkable && !entry.completed && entry.date < today();
  const details = [
    ENTRY_TYPE_INFO[entry.type].label,
    subject?.name ?? "Allgemein",
    `${formatDate(entry.date)}, ${relativeDay(entry.date)}`,
  ].join(" · ");

  const toggle = (completed: boolean) => {
    markToggled(entry.id, entry.completed);
    setEntryCompleted(entry.id, completed);
  };

  return NavigationRow.asListItem(
    {
      onPress: () => router.push({ pathname: "/entry/[id]", params: { id: String(entry.id) } }),
      leading: checkable ? (
        <TaskCheckbox
          value={entry.completed}
          accessibilityLabel={entry.title}
          color={subject?.color ?? NEUTRAL_COLOR}
          onValueChange={toggle}
        />
      ) : (
        <SubjectDot color={subject?.color ?? NEUTRAL_COLOR} />
      ),
      supportingText: (
        <Text textStyle={{ color: overdue ? ink.danger : ink.secondary, fontSize: 13 }}>
          {details}
        </Text>
      ),
      children: done ? (
        <Text textStyle={{ color: ink.secondary }}>{entry.title}</Text>
      ) : (
        entry.title
      ),
    },
    ink
  );
}

function EntryRowComponent(props: EntryRowProps) {
  return entryItem(props, useInk());
}

export const EntryRow: RowComponent<EntryRowProps> = Object.assign(EntryRowComponent, {
  asListItem: entryItem,
});
