import { BottomSheet, Button, FieldGroup, Icon, ListItem, Row, Text, TextInput } from "@expo/ui";
import { useState } from "react";

import { type SearchPickerSheetProps, usePickerSections } from "@/components/search-picker";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Android: a Material bottom sheet that opens at half height with the drag handle on top, so it
// can be pulled up or swiped down to close (also: tapping the scrim, the back gesture). "Neue …"
// shows the form in place of the list. iOS has its own sheet (search-picker-sheet.ios.tsx).
export function SearchPickerSheet<T extends { id: number }>(props: SearchPickerSheetProps<T>) {
  const ink = useInk();
  const searchIcon = useSymbol("magnifyingglass", "search");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const { create } = props;

  const close = () => {
    setQuery("");
    setCreating(false);
    props.onDismiss();
  };
  const { sections, choose } = usePickerSections(props, query, close);

  return (
    <BottomSheet
      isPresented={props.isPresented}
      onDismiss={close}
      snapPoints={["half", "full"]}
      contentPadding={0}>
      {create && creating ? (
        <FieldGroup>
          <FieldGroup.Section title={create.label}>{create.fields}</FieldGroup.Section>
          <FieldGroup.Section>
            <Button
              variant="text"
              label="Hinzufügen"
              disabled={!create.canSave}
              onPress={async () => choose(await create.save())}
            />
            <Button variant="text" label="Abbrechen" onPress={() => setCreating(false)} />
          </FieldGroup.Section>
        </FieldGroup>
      ) : (
        <FieldGroup>
          <FieldGroup.Section title={props.title}>
            <Row alignment="center" spacing={8}>
              {searchIcon && <Icon name={searchIcon} size={17} color={ink.secondary} />}
              <TextInput
                placeholder={props.searchPlaceholder}
                placeholderTextColor={ink.tertiary}
                autoCorrect={false}
                returnKeyType="search"
                onChangeText={setQuery}
              />
            </Row>
          </FieldGroup.Section>
          {create && !query.trim() && (
            <FieldGroup.Section>
              <ListItem
                onPress={() => {
                  create.start();
                  setCreating(true);
                }}>
                <Text textStyle={{ color: ink.accent }}>{create.label}</Text>
              </ListItem>
            </FieldGroup.Section>
          )}
          {sections}
        </FieldGroup>
      )}
    </BottomSheet>
  );
}
