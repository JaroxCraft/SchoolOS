import { router, Stack } from "expo-router";
import { useMemo } from "react";
import { Platform } from "react-native";

// iOS: keeps a pushed form with unsaved changes open until the user answers "Änderungen
// verwerfen?" (useDiscardGuard). The native back button and the swipe from the edge would take
// the screen away first and bring it back with the question afterwards, so while there are
// changes the swipe is off and "Abbrechen", which asks first, takes the place of the back button,
// like the edit forms of the Apple apps. Android asks before leaving with its own back arrow and
// gesture.
export function DiscardGuardHeader({ dirty }: { dirty: boolean }) {
  // Always set, not only while dirty: an option set from a page stays after it unmounts, so the
  // swipe must be turned back on explicitly. Memoized, so it is only set again when it changes.
  const options = useMemo(() => ({ gestureEnabled: !dirty }), [dirty]);

  if (Platform.OS !== "ios") return null;

  return (
    <>
      <Stack.Screen options={options} />
      {dirty && (
        <>
          <Stack.Screen.BackButton hidden />
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={() => router.back()}>Abbrechen</Stack.Toolbar.Button>
          </Stack.Toolbar>
        </>
      )}
    </>
  );
}
