export type Platform = "ios" | "android" | "neither";

const root = document.documentElement;

/** Set by the head script in Base.astro from the user agent. */
export const platform = (root.dataset.platform ?? "neither") as Platform;

/** Shows the chosen platform's steps for this page view only. */
export function choosePlatform(choice: "ios" | "android") {
  root.dataset.platform = choice;
}
