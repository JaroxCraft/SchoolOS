import { AppStack } from "@/components/app-stack";

// The settings sheet. Its screens are pushed on top of the settings, whose "Fertig" closes the
// sheet; swiping the sheet down closes it from any screen. A screen opened by a link gets the
// settings below it, so back leads to them.
export const unstable_settings = {
  anchor: "index",
};

export default AppStack;
