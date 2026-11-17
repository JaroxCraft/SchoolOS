import { ListItem, Text } from "@expo/ui";

import { RowActions } from "@/components/row-actions";
import type { RowComponent } from "@/components/rows";
import { TaskCheckbox, toggleHaptic } from "@/components/task-checkbox";
import type { Entry, Subject } from "@/db/schema";
import { checkOffEntry } from "@/hooks/use-entry-placement";
import { type Ink, useInk } from "@/hooks/use-ink";
import { deleteAction, editAction, entryDeletion } from "@/lib/confirm-delete";
import { formatDate, relativeDay } from "@/lib/dates";
import { isOverdue } from "@/lib/entry-status";
import { ENTRY_TYPE_INFO, NO_SUBJECT_LABEL } from "@/lib/entry-types";
import { openEntry } from "@/lib/routes";
import type { RowAction } from "@/lib/row-action";
import { NEUTRAL_COLOR } from "@/lib/subject-colors";
import { SYSTEM_COLORS } from "@/lib/system-colors";
import { typography } from "@/lib/typography";

type EntryRowProps = {
  entry: Entry;
  subject: Subject | undefined;
  // From useNow of the screen, for "overdue" and "morgen"; the row has no hooks (asListItem)
  today: string;
};

// Every entry gets a checkbox in its subject color: it stays open until checked off, its date only
// decides whether it is overdue. An entry checked off is dimmed and, like one reopened, stays in
// its place for a moment before it moves (see useEntryPlacement). Tapping the row opens the entry as
// a sheet, so it has no disclosure chevron: the chevron promises a screen pushed in the same stack
// (Apple HIG, lists). Built without hooks, so <FormList> can use it as the list item itself.
function entryItem({ entry, subject, today }: EntryRowProps, ink: Ink) {
  const overdue = isOverdue(entry, today);
  const details = [
    ENTRY_TYPE_INFO[entry.type].label,
    subject?.name ?? NO_SUBJECT_LABEL,
    `${formatDate(entry.date)}, ${relativeDay(entry.date, today)}`,
  ].join(" · ");

  return (
    <ListItem
      onPress={() => openEntry({ id: entry.id })}
      leading={
        <TaskCheckbox
          value={entry.completed}
          accessibilityLabel={entry.title}
          color={subject?.color ?? NEUTRAL_COLOR}
          onValueChange={(completed) => checkOffEntry(entry, completed)}
        />
      }
      supportingText={
        <Text {...typography("footnote", { color: overdue ? ink.danger : ink.secondary })}>
          {details}
        </Text>
      }>
      {entry.completed ? (
        <Text textStyle={{ color: ink.secondary }}>{entry.title}</Text>
      ) : (
        entry.title
      )}
    </ListItem>
  );
}

// Swipe right checks an entry off or reopens it, with the haptic of the checkbox; swipe left
// deletes it after asking, like a subject or teacher. A long press offers the same and
// "Bearbeiten" (iOS: swipe actions and context menu; Android: the menu of a long press, see
// <FormGroup>). Built without hooks, so <FormGroup> can use it as the list item itself.
function entryRow(props: EntryRowProps, ink: Ink) {
  const { entry } = props;
  const toggle: RowAction = {
    label: entry.completed ? "Offen" : "Erledigt",
    icon: entry.completed ? "arrow.uturn.backward" : "checkmark",
    tint: SYSTEM_COLORS.green,
    onPress: () => {
      toggleHaptic(!entry.completed);
      checkOffEntry(entry, !entry.completed);
    },
  };
  const remove = deleteAction(entryDeletion(entry));
  const edit = editAction(() => openEntry({ id: entry.id }));

  return (
    <RowActions leading={[toggle]} trailing={[remove]} menu={[toggle, edit, remove]}>
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
