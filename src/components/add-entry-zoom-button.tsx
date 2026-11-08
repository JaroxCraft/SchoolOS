import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { useInk } from "@/hooks/use-ink";
import { NEW_ENTRY } from "@/lib/routes";
import { isSheetClosing } from "@/lib/sheet-transition";

// iOS: the "+" in the navigation bar, from which the new entry grows (zoom transition, iOS 18+;
// older systems slide it up from the bottom). A native bar button cannot be the source of the zoom,
// so this is a view in <Stack.Toolbar.View>, with its own glass background.
export function AddEntryZoomButton() {
  const ink = useInk();

  return (
    <Link
      href={NEW_ENTRY}
      asChild
      // Not while the last entry still shrinks back into this button, see markSheetClosing
      onPress={(event) => {
        if (isSheetClosing()) event.preventDefault();
      }}>
      <Link.AppleZoom>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Neuer Eintrag"
          style={styles.button}>
          <SymbolView name="plus" size={19} weight="medium" tintColor={ink.label} />
        </Pressable>
      </Link.AppleZoom>
    </Link>
  );
}

const styles = StyleSheet.create({
  // The size of a bar button
  button: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
