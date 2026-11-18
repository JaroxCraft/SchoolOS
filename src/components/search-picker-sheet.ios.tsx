import { FieldGroup, Text } from "@expo/ui";
import {
  BottomSheet,
  Button,
  Group,
  Host,
  NavigationDestination,
  NavigationStack,
  Toolbar,
  ToolbarItem,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  disabled,
  frame,
  navigationBarTitleDisplayMode,
  navigationTitle,
  presentationDetents,
  type PresentationDetent,
  presentationDragIndicator,
  searchable,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect, useState } from "react";

import { FormGroup } from "@/components/form-group";
import { NavigationRow } from "@/components/rows";
import { type SearchPickerSheetProps, usePickerSections } from "@/components/search-picker";
import { useInk } from "@/hooks/use-ink";
import { t } from "@/i18n";
import { endEditing } from "@/lib/focused-fields";

const FORM = "form";

// iOS: a sheet like the pickers of the system apps. It opens at half height with the grabber on
// top, so it can be pulled up or swiped down to close; the xmark at the top left closes it too.
// The title sits in the navigation bar, the system search field below it. "Add …" pushes the
// form inside the sheet, with ✓ "Add" at the top right; "Edit" of an item (swipe left or long
// press) pushes it filled in, with ✓ "Save". The form pulls the sheet up to full height,
// where it stays when the keyboard closes. The SwiftUI sheet is used instead of the universal
// BottomSheet, which does not offer to choose the height.
export function SearchPickerSheet<T extends { id: number }>(props: SearchPickerSheetProps<T>) {
  const ink = useInk();
  const [query, setQuery] = useState("");
  const [path, setPath] = useState<string[]>([]);
  const [detent, setDetent] = useState<PresentationDetent>("medium");
  const [editing, setEditing] = useState<T>();
  const searchText = useNativeState("");
  const { form } = props;

  // Leave the form's text field first: SwiftUI gives the focus back to it when the sheet closes,
  // and the keyboard would come up again over the form
  useEffect(() => {
    if (props.isPresented) endEditing();
  }, [props.isPresented]);

  const close = () => {
    setQuery("");
    setPath([]);
    setDetent("medium");
    searchText.set("");
    props.onDismiss();
  };
  // Not a NavigationLink, which pushes before React can prepare the form: this fills the form,
  // pushes it and pulls the sheet up in one update, so the push, the sheet and the keyboard move
  // together
  const openForm = (item?: T) => {
    form?.start(item);
    setEditing(item);
    setDetent("large");
    setPath([FORM]);
  };
  const { sections, saving, formTitle, saveForm } = usePickerSections(
    props,
    query,
    close,
    form ? openForm : undefined
  );

  return (
    // Takes no room or touches of its own; the sheet is presented above everything
    <Host style={{ position: "absolute" }} pointerEvents="none">
      <BottomSheet
        isPresented={props.isPresented}
        onIsPresentedChange={(presented) => {
          if (!presented) close();
        }}>
        <Group
          modifiers={[
            frame({ maxWidth: Infinity, alignment: "topLeading" }),
            presentationDragIndicator("visible"),
            presentationDetents(["medium", "large"], {
              selection: detent,
              onSelectionChange: setDetent,
            }),
          ]}>
          <NavigationStack path={path} onPathChange={setPath}>
            <Toolbar>
              {/* A plain FieldGroup: its only text field is the system search field, which ends
              its own editing */}
              <FieldGroup
                modifiers={[
                  navigationTitle(props.title),
                  navigationBarTitleDisplayMode("inline"),
                  searchable(searchText, { prompt: props.searchPlaceholder, onChange: setQuery }),
                ]}>
                {form && !query.trim() && (
                  <FieldGroup.Section>
                    <NavigationRow onPress={() => openForm()}>
                      <Text textStyle={{ color: ink.accent }}>{form.addLabel}</Text>
                    </NavigationRow>
                  </FieldGroup.Section>
                )}
                {sections}
              </FieldGroup>
              <Toolbar.Content>
                <ToolbarItem placement="cancellationAction">
                  {/* Label and icon are needed: without them the button is empty before iOS 26 */}
                  <Button role="close" label={t.common.close} systemImage="xmark" onPress={close} />
                </ToolbarItem>
              </Toolbar.Content>
            </Toolbar>

            {form && (
              <NavigationDestination value={FORM}>
                <Toolbar>
                  <FormGroup
                    modifiers={[
                      navigationTitle(formTitle(editing)),
                      navigationBarTitleDisplayMode("inline"),
                    ]}>
                    <FieldGroup.Section>{form.fields}</FieldGroup.Section>
                  </FormGroup>
                  <Toolbar.Content>
                    <ToolbarItem placement="confirmationAction">
                      <Button
                        label={editing ? t.common.save : t.common.add}
                        systemImage="checkmark"
                        modifiers={[disabled(!form.canSave || saving)]}
                        onPress={() => saveForm(editing !== undefined, () => setPath([]))}
                      />
                    </ToolbarItem>
                  </Toolbar.Content>
                </Toolbar>
              </NavigationDestination>
            )}
          </NavigationStack>
        </Group>
      </BottomSheet>
    </Host>
  );
}
