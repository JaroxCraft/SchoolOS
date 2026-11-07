import { AppStack } from "@/components/app-stack";

// Screens opened directly (a setup step of the Übersicht) get the settings below them: back leads
// to the settings, whose "Fertig" closes them, and swiping the sheet down closes everything.
export const unstable_settings = {
  anchor: "index",
};

export default AppStack;
