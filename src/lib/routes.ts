import { type Href, router, useRoute } from "expo-router";

import type { RowAction } from "@/components/row-actions";
import { isSheetClosing } from "@/lib/sheet-transition";

// About as long as a push or a sheet takes to come in
const OPENING_MS = 500;
let openingUntil = 0;

// Two rows touched at the same time, or one tapped twice quickly, would open two screens on top of
// each other: only the first counts while a screen is still coming in. Returns whether this one may
// open; a <Link> that opens a screen asks it in its onPress and prevents the default otherwise.
export function claimOpening(): boolean {
  const now = Date.now();
  if (now < openingUntil) return false;
  openingUntil = now + OPENING_MS;
  return true;
}

// Opens a screen or sheet, the one way the app does it (see claimOpening)
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

// The screen of a subject, pushed onto the stack of the overview or timetable tab it is opened from
export const subjectHref = (subjectId: number) =>
  ({ pathname: "/subject/[subjectId]", params: { subjectId: String(subjectId) } }) as const;

export function openSubject(subjectId: number) {
  openScreen(subjectHref(subjectId));
}

// The long-press actions of a lesson, the same in the overview and on the timetable cards.
// "Stundenplan bearbeiten" opens the editor of the settings sheet (✓ "Sichern" and back), not the
// one of the first setup.
export function lessonActions(subjectId: number): RowAction[] {
  return [
    { label: "Neuer Eintrag", icon: "plus", onPress: () => openEntry({ id: "new", subjectId }) },
    { label: "Fach anzeigen", icon: "book", onPress: () => openSubject(subjectId) },
    {
      label: "Stundenplan bearbeiten",
      icon: "pencil",
      onPress: () => openScreen(SCHOOL_ROUTES.settings.timetable),
    },
  ];
}

// The screens that set up the school (period grid, subjects, timetable and the subject form) exist
// in two stacks: in the settings sheet, and pushed onto the overview or timetable tab for the
// first setup, so back always leads to where the user came from.
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
