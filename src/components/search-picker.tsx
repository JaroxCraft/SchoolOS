import { FieldGroup, Icon, ListItem, Text } from "@expo/ui";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";

import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Choices above the items, e.g. "Frei" in the timetable or "Allgemein" for entries
export type ExtraChoice = { label: string; value: number };

// Creating a new item right in the sheet, e.g. "Neue Lehrperson". The form is pushed inside the
// sheet (iOS) or takes the place of the list (Android); the new item is picked and the sheet closes.
export type PickerCreate = {
  label: string;
  // The rows of the form
  fields: ReactNode;
  canSave: boolean;
  // Saves the new item and returns its id
  save: () => Promise<number>;
};

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
  create?: PickerCreate;
  value: number;
  onChange: (value: number) => void;
};

// The sections of the list: the extra choices (hidden while searching) and the matching items,
// returned as an array, so they are direct children of the sheet's <FieldGroup>. `choose` picks
// a value and closes the sheet.
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
  close: () => void
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
        {matches.map((item) => (
          <ListItem
            key={item.id}
            onPress={() => choose(item.id)}
            leading={renderLeading?.(item)}
            supportingText={getSupportingText?.(item)}
            trailing={checkmark(item.id === value)}>
            {getLabel(item)}
          </ListItem>
        ))}
      </FieldGroup.Section>
    ),
  ];

  return { sections, choose };
}
