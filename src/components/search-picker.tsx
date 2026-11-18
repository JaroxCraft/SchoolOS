import { FieldGroup, Icon, ListItem, Text } from "@expo/ui";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";

import { RowActions } from "@/components/row-actions";
import { useInk } from "@/hooks/use-ink";
import { useSaving } from "@/hooks/use-saving";
import { useSymbol } from "@/hooks/use-symbol";
import { t } from "@/i18n";
import { editAction } from "@/lib/confirm-delete";
import { saveFailed } from "@/lib/save-failed";
import { SYSTEM_COLORS } from "@/lib/system-colors";

// "None" in every picker and select: no subject ("General"), no teacher ("None"), a free period
// ("Free") or no period. Ids of saved rows start at 1, so 0 never collides with one.
export const NONE = 0;

export function noneToNull(id: number): number | null {
  return id === NONE ? null : id;
}

export type ExtraChoice = { label: string; value: number };

export type PickerForm<T> = {
  addLabel: string;
  newTitle: string;
  editTitle: (item: T) => string;
  fields: ReactNode;
  canSave: boolean;
  // Fills the form: empty for a new item, with the values of `item` to change it. Called each
  // time the form is opened, so a draft that was left with back or "Cancel" is not saved later.
  start: (item?: T) => void;
  save: () => Promise<number>;
};

export type SearchPickerSheetProps<T extends { id: number }> = {
  isPresented: boolean;
  onDismiss: () => void;
  title: string;
  searchPlaceholder: string;
  items: T[];
  itemsTitle: string;
  getLabel: (item: T) => string;
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
// returned as an array, so they are direct children of the sheet's <FieldGroup>. With `onEdit`,
// every item can be changed from its row actions (iOS: swipe left or long press; Android: long
// press). Also the title of the form and saving it, with `saving` while the save runs.
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
    form,
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

  // While the form saves, so a second tap cannot add the item twice
  const { saving, run } = useSaving();
  const formTitle = (item: T | undefined) => {
    if (!form) return "";
    return item ? form.editTitle(item) : form.newTitle;
  };
  // A new item is picked, which closes the sheet. A changed item stays as it was picked:
  // `backToList` shows the list again with the change.
  const saveForm = (isEdit: boolean, backToList: () => void) =>
    run(async () => {
      if (!form) return;
      try {
        const id = await form.save();
        if (isEdit) backToList();
        else choose(id);
      } catch {
        saveFailed();
      }
    });

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
      <FieldGroup.Section
        // Android draws a second line that appears or goes later (e.g. after "Edit") only
        // in new rows, and its sections key their rows by position, so the section is rebuilt
        key={`items:${matches.map((item) => (getSupportingText?.(item) ? 1 : 0)).join("")}`}
        title={itemsTitle}>
        {matches.length === 0 && <Text>{t.school.searchPicker.noMatches(query.trim())}</Text>}
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
          // Gray like the swipe buttons that change a row in Mail
          const edit = editAction(() => onEdit(item), SYSTEM_COLORS.gray);
          return (
            <RowActions key={item.id} trailing={[edit]} menu={[edit]}>
              {row}
            </RowActions>
          );
        })}
      </FieldGroup.Section>
    ),
  ];

  return { sections, saving, formTitle, saveForm };
}
