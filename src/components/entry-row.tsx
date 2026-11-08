import { ListItem, Text } from "@expo/ui";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { type RowAction, RowActions } from "@/components/row-actions";
import type { RowComponent } from "@/components/rows";
import { SubjectDot } from "@/components/subject-dot";
import { TaskCheckbox } from "@/components/task-checkbox";
import { deleteEntry, setEntryCompleted } from "@/db/actions";
import type { Entry, Subject } from "@/db/schema";
import { type Ink, useInk } from "@/hooks/use-ink";
import { markToggled } from "@/hooks/use-recently-completed";
import { formatDate, relativeDay, today } from "@/lib/dates";
import { ENTRY_TYPE_INFO, isCheckable } from "@/lib/entry-types";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { typography } from "@/lib/typography";

const DONE_GREEN = "#34C759";

const openEntry = (entry: Entry) =>
  router.push({ pathname: "/entry/[id]", params: { id: String(entry.id) } });

// A task checked off or reopened stays in its place until the screen is left (useWasCompleted)
function setCompleted(entry: Entry, completed: boolean) {
  markToggled(entry.id, entry.completed);
  setEntryCompleted(entry.id, completed);
}

type EntryRowProps = {
  entry: Entry;
  subject: Subject | undefined;
};

// Homework and submissions get a checkbox, everything else the subject color. A task checked off
// is dimmed and, like an unchecked one, stays in its place until the screen is left (see
// useWasCompleted). Tapping the row opens the entry as a sheet, so it has no disclosure chevron:
// the chevron promises a screen pushed in the same stack (Apple HIG, lists). Built without hooks,
// so <FormList> can use it as the list item itself.
function entryItem({ entry, subject }: EntryRowProps, ink: Ink) {
  const checkable = isCheckable(entry.type);
  const done = checkable && entry.completed;
  const overdue = checkable && !entry.completed && entry.date < today();
  const details = [
    ENTRY_TYPE_INFO[entry.type].label,
    subject?.name ?? "Allgemein",
    `${formatDate(entry.date)}, ${relativeDay(entry.date)}`,
  ].join(" · ");

  return (
    <ListItem
      onPress={() => openEntry(entry)}
      leading={
        checkable ? (
          <TaskCheckbox
            value={entry.completed}
            accessibilityLabel={entry.title}
            color={subject?.color ?? NEUTRAL_COLOR}
            onValueChange={(completed) => setCompleted(entry, completed)}
          />
        ) : (
          <SubjectDot color={subject?.color ?? NEUTRAL_COLOR} />
        )
      }
      supportingText={
        <Text {...typography("footnote", { color: overdue ? ink.danger : ink.secondary })}>
          {details}
        </Text>
      }>
      {done ? <Text textStyle={{ color: ink.secondary }}>{entry.title}</Text> : entry.title}
    </ListItem>
  );
}

// Swipe right checks a task off or reopens it, swipe left deletes the entry, as in Reminders; a
// long press offers the same and "Bearbeiten" (iOS: swipe actions and context menu; Android: the
// menu of a long press, see <FormGroup>). Built without hooks, so <FormGroup> can use it as the
// list item itself.
function entryRow(props: EntryRowProps, ink: Ink) {
  const { entry } = props;
  const toggle: RowAction | undefined = isCheckable(entry.type)
    ? {
        label: entry.completed ? "Offen" : "Erledigt",
        icon: entry.completed ? "arrow.uturn.backward" : "checkmark",
        tint: DONE_GREEN,
        onPress: () => {
          Haptics.selectionAsync();
          setCompleted(entry, !entry.completed);
        },
      }
    : undefined;
  const remove: RowAction = {
    label: "Löschen",
    icon: "trash",
    destructive: true,
    onPress: () => deleteEntry(entry.id),
  };
  const edit: RowAction = { label: "Bearbeiten", icon: "pencil", onPress: () => openEntry(entry) };

  return (
    <RowActions
      leading={toggle && [toggle]}
      trailing={[remove]}
      menu={[...(toggle ? [toggle] : []), edit, remove]}>
      {entryItem(props, ink)}
    </RowActions>
  );
}

function EntryRowComponent(props: EntryRowProps) {
  return entryRow(props, useInk());
}

export const EntryRow: RowComponent<EntryRowProps> = Object.assign(EntryRowComponent, {
  asListItem: entryRow,
});
