import { Button, Host, NavigationStack, Toolbar, ToolbarItem } from "@expo/ui/swift-ui";
import {
  disabled,
  navigationBarTitleDisplayMode,
  navigationTitle,
} from "@expo/ui/swift-ui/modifiers";
import { router, useNavigation } from "expo-router";
import type { NativeStackNavigationProp } from "expo-router/native-stack";
import { useEffect, useRef } from "react";

import { FormGroup } from "@/components/form-group";
import type { SheetFormProps } from "@/components/sheet-form";
import { markSheetClosing } from "@/lib/sheet-transition";

// Longer than any presentation, in case the end of the transition is never reported
const PRESENTED_FALLBACK_MS = 1500;

// iOS: the sheet draws its own navigation bar in SwiftUI, with × "Abbrechen" and ✓ "Sichern" as in
// the forms of Music and Calendar. The route hides the header of the stack (src/app/_layout.tsx):
// with it, react-native-screens nests a second stack in the sheet, and the zoom transition from the
// "+" (Link.AppleZoom) would be set on that inner screen instead of the presented one, so the
// sheet would slide up instead of growing out of the button.
//
// Closing it while it still zooms in would leave react-native-screens unable to present or dismiss
// any modal until the app restarts (expo/expo#43804, fixed by software-mansion/react-native-screens
// #4731, not released yet). So × and ✓ take a tap at any time, but carry it out once the sheet is
// fully presented; and the "+" waits while the sheet shrinks back (markSheetClosing).
export function SheetForm({ title, canSave, onSave, children }: SheetFormProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const presented = useRef(false);
  // A tap on × or ✓ during the presentation, carried out at its end
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    const finishPresenting = () => {
      if (presented.current) return;
      presented.current = true;
      pending.current?.();
      pending.current = null;
    };
    const fallback = setTimeout(finishPresenting, PRESENTED_FALLBACK_MS);
    const unsubscribe = navigation.addListener("transitionEnd", (event) => {
      if (!event.data.closing) finishPresenting();
    });
    return () => {
      clearTimeout(fallback);
      unsubscribe();
      markSheetClosing();
    };
  }, [navigation]);

  const whenPresented = (action: () => void) => {
    if (presented.current) action();
    else pending.current = action;
  };

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
                onPress={() => whenPresented(() => router.back())}
              />
            </ToolbarItem>
            <ToolbarItem placement="confirmationAction">
              <Button
                label="Sichern"
                systemImage="checkmark"
                modifiers={[disabled(!canSave)]}
                onPress={() => whenPresented(onSave)}
              />
            </ToolbarItem>
          </Toolbar.Content>
        </Toolbar>
      </NavigationStack>
    </Host>
  );
}
