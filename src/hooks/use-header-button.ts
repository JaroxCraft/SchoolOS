import { Stack } from "expo-router";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

import { useSymbol } from "@/hooks/use-symbol";

type ToolbarButtonProps = ComponentProps<typeof Stack.Toolbar.Button>;

type HeaderButton = {
  label: string;
  // iOS: the bold "done" style of the button that ends the screen
  done?: boolean;
  // Android toolbars only render icon buttons
  sf: SFSymbol;
  md: AndroidSymbol;
};

const BUTTONS = {
  save: { label: "Sichern", done: true, sf: "checkmark", md: "check" },
  next: { label: "Weiter", sf: "arrow.right", md: "arrow_forward" },
  finish: { label: "Fertig", done: true, sf: "checkmark", md: "check" },
} satisfies Record<string, HeaderButton>;

// Props for a text button in the navigation bar on iOS, an icon button on Android. Spread them onto
// a <Stack.Toolbar.Button> placed directly inside <Stack.Toolbar>: iOS ignores buttons wrapped in
// another component. Returns null on Android until the Material Symbol has loaded.
function useHeaderButton({ label, done, sf, md }: HeaderButton): ToolbarButtonProps | null {
  const androidIcon = useSymbol(sf, md);

  if (Platform.OS === "ios") {
    return done ? { variant: "done", children: label } : { children: label };
  }
  return androidIcon ? { icon: androidIcon, accessibilityLabel: label } : null;
}

// "Sichern" of a form
export const useSaveButton = () => useHeaderButton(BUTTONS.save);

// "Weiter" to the next setup step, "Fertig" on the last one
export const useStepButton = (step: "next" | "done") =>
  useHeaderButton(step === "next" ? BUTTONS.next : BUTTONS.finish);
