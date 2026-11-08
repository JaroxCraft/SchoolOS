import { router, Stack } from "expo-router";
import { Platform } from "react-native";

// iOS: while a pushed form has unsaved changes, "Abbrechen" takes the place of the back button.
// The native back button leaves the screen before the app can ask, and the screen comes back
// with the question afterwards; "Abbrechen" asks first (useDiscardGuard), like the edit forms of
// the Apple apps. The swipe from the edge is held back natively and asks too. Android asks before
// leaving with its own back arrow and gesture.
export function DiscardCancelButton({ dirty }: { dirty: boolean }) {
  if (Platform.OS !== "ios" || !dirty) return null;

  return (
    <>
      <Stack.Screen.BackButton hidden />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>Abbrechen</Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
