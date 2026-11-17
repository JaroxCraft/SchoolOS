import { Stack } from "expo-router";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

import { useSymbol } from "@/hooks/use-symbol";

type ToolbarButtonProps = ComponentProps<typeof Stack.Toolbar.Button>;

type HeaderButton = {
  label: string;
  done?: boolean;
  // iOS: an icon instead of the label, as the ✓ and × of the forms in the Apple apps (Music,
  // Calendar); the label stays for VoiceOver. Android toolbars only render icon buttons anyway.
  iconOnIOS?: boolean;
  sf: SFSymbol;
  md: AndroidSymbol;
};

const BUTTONS = {
  save: { label: "Sichern", done: true, iconOnIOS: true, sf: "checkmark", md: "check" },
  next: { label: "Weiter", sf: "arrow.right", md: "arrow_forward" },
  finish: { label: "Fertig", done: true, sf: "checkmark", md: "check" },
} satisfies Record<string, HeaderButton>;

// Props for a button in the navigation bar: text or icon on iOS, an icon on Android. Spread them
// onto a <Stack.Toolbar.Button> placed directly inside <Stack.Toolbar>: iOS ignores buttons wrapped
// in another component. Returns null on Android until the Material Symbol has loaded.
function useHeaderButton({
  label,
  done,
  iconOnIOS,
  sf,
  md,
}: HeaderButton): ToolbarButtonProps | null {
  const androidIcon = useSymbol(sf, md);

  if (Platform.OS === "ios") {
    const content = iconOnIOS ? { icon: sf, accessibilityLabel: label } : { children: label };
    return done ? { variant: "done", ...content } : content;
  }
  return androidIcon ? { icon: androidIcon, accessibilityLabel: label } : null;
}

export const useSaveButton = () => useHeaderButton(BUTTONS.save);

export const useStepButton = (step: "next" | "finish") => useHeaderButton(BUTTONS[step]);

export const CANCEL_BUTTON = { icon: "xmark", accessibilityLabel: "Abbrechen" } as const;
