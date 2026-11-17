import type { RowAction } from "@/lib/row-action";

export type LessonMenuProps = {
  actions: RowAction[];
  open: boolean;
  onClose: () => void;
};

export function LessonMenu(_props: LessonMenuProps) {
  return null;
}
