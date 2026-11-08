import { Button, FieldGroup, Icon, ListItem, Row, Text, TextInput } from "@expo/ui";
import {
  Column,
  Host,
  ModalBottomSheet,
  type ModalBottomSheetRef,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import { fillMaxHeight } from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { type SearchPickerSheetProps, usePickerSections } from "@/components/search-picker";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Android: a Material bottom sheet that opens at half height with the drag handle on top, so it
// can be pulled up or swiped down to close (also: tapping the scrim, the back gesture). "Neue …"
// expands it to full height and shows the form in place of the list, like the pushed form in the
// iOS sheet (search-picker-sheet.ios.tsx). The Compose sheet is used instead of the universal
// BottomSheet, which does not offer to expand it.
export function SearchPickerSheet<T extends { id: number }>(props: SearchPickerSheetProps<T>) {
  const ink = useInk();
  const colors = useMaterialColors();
  const searchIcon = useSymbol("magnifyingglass", "search");
  const sheet = useRef<ModalBottomSheetRef>(null);
  // Stays mounted while the sheet slides out after isPresented turned false
  const [mounted, setMounted] = useState(props.isPresented);
  if (props.isPresented && !mounted) setMounted(true);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const { create } = props;

  useEffect(() => {
    if (props.isPresented) return;
    let cancelled = false;
    sheet.current?.hide().then(() => {
      if (!cancelled) setMounted(false);
    });
    return () => {
      cancelled = true;
    };
  }, [props.isPresented]);

  const close = () => {
    setQuery("");
    setCreating(false);
    props.onDismiss();
  };
  const { sections, choose } = usePickerSections(props, query, close);

  if (!mounted) return null;

  return (
    // Fills the screen without taking touches; the sheet itself is presented in its own window
    <Host style={StyleSheet.absoluteFill} pointerEvents="none">
      <ModalBottomSheet
        ref={sheet}
        onDismissRequest={close}
        // The list paints the Material surface; the sheet's own surfaceContainerLow would frame it
        // in a second color above and below
        containerColor={colors.surface}>
        <Column modifiers={[fillMaxHeight()]}>
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
                      sheet.current?.expand();
                    }}>
                    <Text textStyle={{ color: ink.accent }}>{create.label}</Text>
                  </ListItem>
                </FieldGroup.Section>
              )}
              {sections}
            </FieldGroup>
          )}
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
