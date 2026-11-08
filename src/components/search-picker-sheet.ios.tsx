import { BottomSheet, FieldGroup, Text } from "@expo/ui";
import {
  Button,
  NavigationDestination,
  NavigationLink,
  NavigationStack,
  Toolbar,
  ToolbarItem,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  disabled,
  navigationBarTitleDisplayMode,
  navigationTitle,
  searchable,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";

import { FormGroup } from "@/components/form-group";
import { type SearchPickerSheetProps, usePickerSections } from "@/components/search-picker";
import { useInk } from "@/hooks/use-ink";

const CREATE = "create";

// iOS: a sheet like the pickers of the system apps. It opens at half height with the grabber on
// top, so it can be pulled up or swiped down to close; the xmark at the top left closes it too.
// The title sits in the navigation bar, the system search field below it. "Neue …" pushes the
// form inside the sheet, with "Hinzufügen" at the top right.
export function SearchPickerSheet<T extends { id: number }>(props: SearchPickerSheetProps<T>) {
  const ink = useInk();
  const [query, setQuery] = useState("");
  const [path, setPath] = useState<string[]>([]);
  const searchText = useNativeState("");
  const { create } = props;

  const close = () => {
    setQuery("");
    setPath([]);
    searchText.set("");
    props.onDismiss();
  };
  const { sections, choose } = usePickerSections(props, query, close);

  return (
    <BottomSheet
      isPresented={props.isPresented}
      onDismiss={close}
      snapPoints={["half", "full"]}
      contentPadding={0}>
      <NavigationStack
        path={path}
        onPathChange={(next) => {
          if (next.includes(CREATE) && !path.includes(CREATE)) create?.start();
          setPath(next);
        }}>
        <Toolbar>
          <FormGroup
            modifiers={[
              navigationTitle(props.title),
              navigationBarTitleDisplayMode("inline"),
              searchable(searchText, { prompt: props.searchPlaceholder, onChange: setQuery }),
            ]}>
            {create && !query.trim() && (
              <FieldGroup.Section>
                <NavigationLink value={CREATE}>
                  <Text textStyle={{ color: ink.accent }}>{create.label}</Text>
                </NavigationLink>
              </FieldGroup.Section>
            )}
            {sections}
          </FormGroup>
          <Toolbar.Content>
            <ToolbarItem placement="cancellationAction">
              {/* Label and icon are needed: without them the button is empty before iOS 26 */}
              <Button role="close" label="Schliessen" systemImage="xmark" onPress={close} />
            </ToolbarItem>
          </Toolbar.Content>
        </Toolbar>

        {create && (
          <NavigationDestination value={CREATE}>
            <Toolbar>
              <FormGroup
                modifiers={[
                  navigationTitle(create.label),
                  navigationBarTitleDisplayMode("inline"),
                ]}>
                <FieldGroup.Section>{create.fields}</FieldGroup.Section>
              </FormGroup>
              <Toolbar.Content>
                <ToolbarItem placement="confirmationAction">
                  <Button
                    label="Hinzufügen"
                    modifiers={[disabled(!create.canSave)]}
                    onPress={async () => choose(await create.save())}
                  />
                </ToolbarItem>
              </Toolbar.Content>
            </Toolbar>
          </NavigationDestination>
        )}
      </NavigationStack>
    </BottomSheet>
  );
}
