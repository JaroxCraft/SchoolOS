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
// can be pulled up or swiped down to close (also: tapping the scrim, the back gesture). "… hinzufügen"
// and "Bearbeiten" in the menu of an item's long press expand it to full height and show the form
// in place of the list, like the pushed form in the iOS sheet (search-picker-sheet.ios.tsx). The
// Compose sheet is used instead of the universal BottomSheet, which does not offer to expand it.
export function SearchPickerSheet<T extends { id: number }>(props: SearchPickerSheetProps<T>) {
  const ink = useInk();
  const colors = useMaterialColors();
  const searchIcon = useSymbol("magnifyingglass", "search");
  const sheet = useRef<ModalBottomSheetRef>(null);
  const [mounted, setMounted] = useState(props.isPresented);
  if (props.isPresented && !mounted) setMounted(true);
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState<"new" | { edit: T } | null>(null);
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
    setFormMode(null);
    props.onDismiss();
  };
  const openForm = (item?: T) => {
    form?.start(item);
    setFormMode(item === undefined ? "new" : { edit: item });
    sheet.current?.expand();
  };
  const { sections, saving, formTitle, saveForm } = usePickerSections(
    props,
    query,
    close,
    form ? openForm : undefined
  );

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
        {form && formMode ? (
          <FormGroup>
            <FieldGroup.Section title={formTitle(formMode === "new" ? undefined : formMode.edit)}>
              {form.fields}
            </FieldGroup.Section>
            <FieldGroup.Section>
              <Button
                variant="text"
                label={formMode === "new" ? "Hinzufügen" : "Sichern"}
                disabled={!form.canSave || saving}
                onPress={() => saveForm(formMode !== "new", () => setFormMode(null))}
              />
              <Button variant="text" label="Abbrechen" onPress={() => setFormMode(null)} />
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
                <ListItem onPress={() => openForm()}>
                  <Text textStyle={{ color: ink.accent }}>{form.addLabel}</Text>
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
