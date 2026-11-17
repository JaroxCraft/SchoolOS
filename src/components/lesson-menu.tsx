import type { RowAction } from "@/components/row-actions";

export type LessonMenuProps = {
  // See lessonActions
  actions: RowAction[];
  open: boolean;
  onClose: () => void;
};

// iOS: the card's <Link.Menu> is its context menu, so there is nothing to add here. Android:
// lesson-menu.android.tsx.
export function LessonMenu(_props: LessonMenuProps) {
  return null;
}
