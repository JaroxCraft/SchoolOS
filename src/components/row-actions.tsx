import type { ReactElement } from "react";

import type { RowAction } from "@/lib/row-action";

export type RowActionsProps = {
  // Revealed by swiping right; a full swipe runs the first one
  leading?: RowAction[];
  // Revealed by swiping left; a full swipe runs the first one
  trailing?: RowAction[];
  menu?: RowAction[];
  children: ReactElement;
};

export function RowActions({ children }: RowActionsProps) {
  return children;
}
RowActions.rowActions = true as const;
