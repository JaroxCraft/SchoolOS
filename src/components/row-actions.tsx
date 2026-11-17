import type { ReactElement } from "react";

import type { RowAction } from "@/lib/row-action";

export type RowActionsProps = {
  // Revealed by swiping right; a full swipe runs the first one
  leading?: RowAction[];
  // Revealed by swiping left; a full swipe runs the first one
  trailing?: RowAction[];
  // The context menu of a long press
  menu?: RowAction[];
  children: ReactElement;
};

// Android: no swipe actions (Material has no such pattern); <FormGroup> gives the row the `menu`
// as a Material menu on a long press, and keeps the row a direct list item of its section. On its
// own the row is shown as it is. iOS: row-actions.ios.tsx.
export function RowActions({ children }: RowActionsProps) {
  return children;
}
RowActions.rowActions = true as const;
