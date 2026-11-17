import { type Href, router, useRoute } from "expo-router";

import { isSheetClosing } from "@/lib/sheet-transition";

// Only one screen or sheet opens at a time. Two rows touched at the same moment, or one tapped
// twice quickly, would otherwise open two on top of each other: the first one opens, and nothing
// else does until its transition has ended (releaseOpening, called by every stack, see
// <AppStack>). The navigation state changes as soon as the push starts, so it is too early; only
// the end of the transition says the screen is in. Should nothing open at all (a link that turned
// out to go nowhere), the lock lifts after this long anyway.
const OPENING_LIMIT_MS = 1000;
let opening = false;
let openingLimit: ReturnType<typeof setTimeout> | undefined;

export function releaseOpening() {
  opening = false;
  clearTimeout(openingLimit);
}

export function claimOpening(): boolean {
  if (opening) return false;
  opening = true;
  openingLimit = setTimeout(releaseOpening, OPENING_LIMIT_MS);
  return true;
}

export function openScreen(href: Href) {
  if (claimOpening()) router.push(href);
}

export const NEW_ENTRY = { pathname: "/entry/[id]", params: { id: "new" } } as const;

// Opens an entry, or a new one (optionally for a subject), as a sheet. Ignored while the last
// zoomed entry still shrinks back into the "+": presenting then makes it jump (isSheetClosing).
export function openEntry({ id, subjectId }: { id: number | "new"; subjectId?: number }) {
  if (isSheetClosing()) return;
  openScreen({
    pathname: "/entry/[id]",
    params:
      subjectId === undefined
        ? { id: String(id) }
        : { id: String(id), subjectId: String(subjectId) },
  });
}

export const subjectHref = (subjectId: number) =>
  ({ pathname: "/subject/[subjectId]", params: { subjectId: String(subjectId) } }) as const;

export function openSubject(subjectId: number) {
  openScreen(subjectHref(subjectId));
}

export const SCHOOL_ROUTES = {
  settings: {
    periods: "/settings/periods",
    subjects: "/settings/subjects",
    timetable: "/settings/timetable",
    subject: "/settings/subject/[id]",
  },
  setup: {
    periods: "/setup/periods",
    subjects: "/setup/subjects",
    timetable: "/setup/timetable",
    subject: "/setup/subject/[id]",
  },
} as const;

// The routes of the stack this school screen is in. `setup` is true in the setup flow, whose
// screens lead on to the next step. Read from the screen's own route, not the focused path of the
// app, so a screen left in a tab in the background keeps its stack.
export function useSchoolRoutes() {
  const setup = useRoute().name.startsWith("setup/");
  return { setup, ...SCHOOL_ROUTES[setup ? "setup" : "settings"] };
}
