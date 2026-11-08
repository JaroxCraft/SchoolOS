import { Button, Host, NavigationStack, Toolbar, ToolbarItem } from "@expo/ui/swift-ui";
import {
  disabled,
  navigationBarTitleDisplayMode,
  navigationTitle,
} from "@expo/ui/swift-ui/modifiers";
import { router, useNavigation, useRoute } from "expo-router";
import type { NativeStackNavigationProp } from "expo-router/native-stack";
import { useEffect, useRef } from "react";

import { FormGroup } from "@/components/form-group";
import type { SheetFormProps } from "@/components/sheet-form";
import { holdSheetClosing, releaseSheetClosing } from "@/lib/sheet-transition";

// Longer than any presentation, in case the end of the transition is never reported
const PRESENTED_FALLBACK_MS = 1500;
// The route param expo-router adds to a screen that zooms out of a Link.AppleZoom
// (INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME, not exported by expo-router)
const ZOOM_SOURCE_PARAM = "__internal_expo_router_zoom_transition_source_id";

// iOS: the sheet draws its own navigation bar in SwiftUI, with × "Abbrechen" and ✓ "Sichern" as in
// the forms of Music and Calendar. The route hides the header of the stack (src/app/_layout.tsx):
// with it, react-native-screens nests a second stack in the sheet, and the zoom transition from the
// "+" (Link.AppleZoom) would be set on that inner screen instead of the presented one, so the
// sheet would slide up instead of growing out of the button.
//
// Closing it while it still zooms in would leave react-native-screens unable to present or dismiss
// any modal until the app restarts (expo/expo#43804, fixed by software-mansion/react-native-screens
// #4731, not released yet). So × and ✓ take a tap at any time, but carry it out once the sheet is
// fully presented; and the "+" waits while the sheet shrinks back (isSheetClosing). A sheet opened
// without the zoom (e.g. an entry from a list) slides down instead and holds back nothing.
export function SheetForm({ title, canSave, onSave, children }: SheetFormProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const params = useRoute().params as Record<string, unknown> | undefined;
  const zoomed = !!params?.[ZOOM_SOURCE_PARAM];
  const presented = useRef(false);
  // A tap on × or ✓ during the presentation, carried out at its end
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Swiped down to the end: the transition is over when the screen unmounts
    let closed = false;
    const finishPresenting = () => {
      if (presented.current) return;
      presented.current = true;
      pending.current?.();
      pending.current = null;
    };
    const fallback = setTimeout(finishPresenting, PRESENTED_FALLBACK_MS);
    const unsubscribeStart = navigation.addListener("transitionStart", (event) => {
      if (event.data.closing) holdSheetClosing();
    });
    const unsubscribeEnd = navigation.addListener("transitionEnd", (event) => {
      if (!event.data.closing) {
        finishPresenting();
        return;
      }
      closed = true;
      releaseSheetClosing(false);
    });
    // Swiping down was cancelled, the sheet stays
    const unsubscribeCancel = navigation.addListener("gestureCancel", () =>
      releaseSheetClosing(false)
    );
    return () => {
      clearTimeout(fallback);
      unsubscribeStart();
      unsubscribeEnd();
      unsubscribeCancel();
      // Closed from JS: unmounted right away, while a zoomed sheet still shrinks back
      if (!closed) releaseSheetClosing(zoomed);
    };
  }, [navigation, zoomed]);

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
