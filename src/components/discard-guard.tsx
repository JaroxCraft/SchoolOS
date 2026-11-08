import { router, Stack } from "expo-router";
import { type ReactNode, useMemo } from "react";
import { PanResponder, Platform, StyleSheet, View } from "react-native";

// A swipe to the right this far, mostly sideways, counts as the swipe back
const SWIPE_DISTANCE = 12;

type DiscardGuardProps = {
  dirty: boolean;
  // The content of the form
  children: ReactNode;
};

// iOS: asks "Änderungen verwerfen?" (useDiscardGuard) as soon as the user tries to leave a pushed
// form with unsaved changes, while the form stays where it is. The native back button and swipe
// would take the screen away first and bring it back with the question afterwards. So while there
// are changes, "Abbrechen", which asks first, takes the place of the back button, and the native
// swipe is off: a swipe to the right over the form asks right away instead. Android asks before
// leaving with its own back arrow and gesture, so it only shows the form.
export function DiscardGuard({ dirty, children }: DiscardGuardProps) {
  // Always set, not only while dirty: an option set from a page stays after it unmounts, so the
  // native swipe must be turned back on explicitly. Memoized, so it is only set when it changes.
  const options = useMemo(() => ({ gestureEnabled: !dirty }), [dirty]);
  const swipeBack = useMemo(
    () =>
      PanResponder.create({
        // Capture phase: the form is a native list, which would not hand the touch on
        onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
          dirty && dx > SWIPE_DISTANCE && dx > 2 * Math.abs(dy),
        // Once per swipe: the guard holds the screen back and asks
        onPanResponderGrant: () => router.back(),
        onPanResponderTerminationRequest: () => false,
      }),
    [dirty]
  );

  if (Platform.OS !== "ios") return children;

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
      <View style={styles.fill} {...swipeBack.panHandlers}>
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
