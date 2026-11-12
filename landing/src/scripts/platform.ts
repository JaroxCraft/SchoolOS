export type Platform = "ios" | "android" | "neither";

const root = document.documentElement;

/** Set by the head script in Base.astro: the saved choice, else the user agent. */
export const platform = (root.dataset.platform ?? "neither") as Platform;

/** Shows the chosen platform's steps and remembers it for later visits. */
export function choosePlatform(choice: "ios" | "android") {
  root.dataset.platform = choice;
  try {
    localStorage.setItem("schoolos-platform", choice);
  } catch {
    // Storage blocked: the choice still holds for this page
  }
}
