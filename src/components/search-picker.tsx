import { FieldGroup, Icon, ListItem, Text } from "@expo/ui";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";

import { RowActions } from "@/components/row-actions";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Choices above the items, e.g. "Frei" in the timetable or "Allgemein" for entries
export type ExtraChoice = { label: string; value: number };

// A form right in the sheet, to add an item ("Neue Lehrperson") or to change one. It is pushed
// inside the sheet (iOS) or takes the place of the list (Android). A new item is picked and the
// sheet closes; after a change the list is shown again.
export type PickerForm<T> = {
  // Title of the form for a new item, and of the row that opens it
  label: string;
  // Title of the form for an existing item. Without it, items cannot be changed in the sheet.
  editLabel?: string;
  // The rows of the form
  fields: ReactNode;
  canSave: boolean;
  // Fills the form: empty for a new item, with the values of `item` to change it. Called each
  // time the form is opened, so a draft that was left with back or "Abbrechen" is not saved later.
  start: (item?: T) => void;
  // Saves the form and returns the id of the item
  save: () => Promise<number>;
};

// systemGray, the color of the swipe buttons that change a row, as in Mail
const EDIT_GRAY = "#8E8E93";

// A sheet listing items (subjects, teachers) to pick one, with a search field. The chosen one is
// marked with a checkmark; picking one closes the sheet. See search-picker-sheet(.ios).tsx.
export type SearchPickerSheetProps<T extends { id: number }> = {
  isPresented: boolean;
  onDismiss: () => void;
  title: string;
  searchPlaceholder: string;
  items: T[];
  // Title of the section with the items
  itemsTitle: string;
  getLabel: (item: T) => string;
  // The texts the search looks in
  getSearchText: (item: T) => (string | null | undefined)[];
  renderLeading?: (item: T) => ReactNode;
  getSupportingText?: (item: T) => string | undefined;
  extraChoices?: ExtraChoice[];
  // Shown in front of the extra choices, e.g. the neutral subject color
  extraLeading?: ReactNode;
  form?: PickerForm<T>;
  value: number;
  onChange: (value: number) => void;
};

// The sections of the list: the extra choices (hidden while searching) and the matching items,
// returned as an array, so they are direct children of the sheet's <FieldGroup>. `choose` picks
// a value and closes the sheet. With `onEdit`, every item can be changed by swiping it left or
// from the menu of a long press (iOS).
export function usePickerSections<T extends { id: number }>(
  {
    items,
    itemsTitle,
    getLabel,
    getSearchText,
    renderLeading,
    getSupportingText,
    extraChoices = [],
    extraLeading,
    value,
    onChange,
  }: SearchPickerSheetProps<T>,
  query: string,
  close: () => void,
  onEdit?: (item: T) => void
) {
  const ink = useInk();
  const check = useSymbol("checkmark", "check");
  const search = query.trim().toLocaleLowerCase();
  const matches = items.filter(
    (item) =>
      !search || getSearchText(item).some((text) => text?.toLocaleLowerCase().includes(search))
  );

  const choose = (next: number) => {
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
    close();
  };
  // The accent color marks the selection, like a checked row in the iOS settings
  const checkmark = (selected: boolean) =>
    selected && check ? <Icon name={check} size={17} color={ink.accent} /> : undefined;

  const sections = [
    !search && extraChoices.length > 0 && (
      <FieldGroup.Section key="extra">
        {extraChoices.map((choice) => (
          <ListItem
            key={choice.value}
            onPress={() => choose(choice.value)}
            leading={extraLeading}
            trailing={checkmark(choice.value === value)}>
            {choice.label}
          </ListItem>
        ))}
      </FieldGroup.Section>
    ),
    (search || items.length > 0) && (
      <FieldGroup.Section key="items" title={itemsTitle}>
        {matches.length === 0 && <Text>{`Nichts gefunden für «${query.trim()}»`}</Text>}
        {matches.map((item) => {
          const row = (
            <ListItem
              key={item.id}
              onPress={() => choose(item.id)}
              leading={renderLeading?.(item)}
              supportingText={getSupportingText?.(item)}
              trailing={checkmark(item.id === value)}>
              {getLabel(item)}
            </ListItem>
          );
          if (!onEdit) return row;
          const edit = {
            label: "Bearbeiten",
            icon: "pencil",
            tint: EDIT_GRAY,
            onPress: () => onEdit(item),
          } as const;
          return (
            <RowActions key={item.id} trailing={[edit]} menu={[edit]}>
              {row}
            </RowActions>
          );
        })}
      </FieldGroup.Section>
    ),
  ];

  return { sections, choose };
}
