import { Button, FieldGroup, Icon, ListItem, Row, Text } from "@expo/ui";
import {
  Host,
  ModalBottomSheet,
  type ModalBottomSheetRef,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { FormGroup } from "@/components/form-group";
import { type SearchPickerSheetProps, usePickerSections } from "@/components/search-picker";
import { TextField } from "@/components/text-field";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Android: a Material bottom sheet that opens at half height with the drag handle on top, so it
// can be pulled up or swiped down to close (also: tapping the scrim, the back gesture). "Neue …"
// expands it to full height and shows the form in place of the list, like the pushed form in the
// iOS sheet (search-picker-sheet.ios.tsx). Items cannot be changed here yet: Android lists have
// no swipe or long-press actions so far. The Compose sheet is used instead of the universal
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
  const { form } = props;

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
        {form && creating ? (
          <FormGroup>
            <FieldGroup.Section title={form.label}>{form.fields}</FieldGroup.Section>
            <FieldGroup.Section>
              <Button
                variant="text"
                label="Hinzufügen"
                disabled={!form.canSave}
                onPress={async () => choose(await form.save())}
              />
              <Button variant="text" label="Abbrechen" onPress={() => setCreating(false)} />
            </FieldGroup.Section>
          </FormGroup>
        ) : (
          <FormGroup>
            <FieldGroup.Section title={props.title}>
              <Row alignment="center" spacing={8}>
                {searchIcon && <Icon name={searchIcon} size={17} color={ink.secondary} />}
                <TextField
                  placeholder={props.searchPlaceholder}
                  autoCorrect={false}
                  returnKeyType="search"
                  onChangeText={setQuery}
                />
              </Row>
            </FieldGroup.Section>
            {form && !query.trim() && (
              <FieldGroup.Section>
                <ListItem
                  onPress={() => {
                    form.start();
                    setCreating(true);
                    sheet.current?.expand();
                  }}>
                  <Text textStyle={{ color: ink.accent }}>{form.label}</Text>
                </ListItem>
              </FieldGroup.Section>
            )}
            {sections}
          </FormGroup>
        )}
      </ModalBottomSheet>
    </Host>
  );
}
