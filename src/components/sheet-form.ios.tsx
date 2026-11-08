import { Button, Host, NavigationStack, Toolbar, ToolbarItem } from "@expo/ui/swift-ui";
import {
  disabled,
  navigationBarTitleDisplayMode,
  navigationTitle,
} from "@expo/ui/swift-ui/modifiers";
import { router } from "expo-router";

import { FormGroup } from "@/components/form-group";
import type { SheetFormProps } from "@/components/sheet-form";

// iOS: the sheet draws its own navigation bar in SwiftUI, with × "Abbrechen" and ✓ "Sichern" as in
// the forms of Music and Calendar. The route hides the header of the stack (src/app/_layout.tsx):
// with it, react-native-screens nests a second stack in the sheet, and the zoom transition from the
// "+" (Link.AppleZoom) would be set on that inner screen instead of the presented one, so the
// sheet would slide up instead of growing out of the button.
export function SheetForm({ title, canSave, onSave, children }: SheetFormProps) {
  return (
    <Host style={{ flex: 1 }}>
      <NavigationStack>
        <Toolbar>
          <FormGroup modifiers={[navigationTitle(title), navigationBarTitleDisplayMode("inline")]}>
            {children}
          </FormGroup>
          <Toolbar.Content>
            <ToolbarItem placement="cancellationAction">
              <Button
                role="close"
                label="Abbrechen"
                systemImage="xmark"
                onPress={() => router.back()}
              />
            </ToolbarItem>
            <ToolbarItem placement="confirmationAction">
              <Button
                label="Sichern"
                systemImage="checkmark"
                modifiers={[disabled(!canSave)]}
                onPress={onSave}
              />
            </ToolbarItem>
          </Toolbar.Content>
        </Toolbar>
      </NavigationStack>
    </Host>
  );
}
