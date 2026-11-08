import { router, useRoute } from "expo-router";

import { isSheetClosing } from "@/lib/sheet-transition";

export const NEW_ENTRY = { pathname: "/entry/[id]", params: { id: "new" } } as const;

// Opens an entry, or a new one (optionally for a subject), as a sheet. Ignored while the last
// zoomed entry still shrinks back into the "+": presenting then makes it jump (isSheetClosing).
export function openEntry({ id, subjectId }: { id: number | "new"; subjectId?: number }) {
  if (isSheetClosing()) return;
  router.push({
    pathname: "/entry/[id]",
    params:
      subjectId === undefined
        ? { id: String(id) }
        : { id: String(id), subjectId: String(subjectId) },
  });
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
