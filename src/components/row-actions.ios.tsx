import { Button, ContextMenu, SwipeActions } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";

import type { RowAction, RowActionsProps } from "@/components/row-actions";
import { SYSTEM_COLORS } from "@/lib/system-colors";

// A button of the context menu, or of a swipe group (`swipe`). A destructive swipe button with the
// destructive role makes iOS remove the row right away; for an action that asks first, the row
// must stay until the user confirms, so the button only takes the red.
function actionButton(action: RowAction, swipe: boolean) {
  const keepsRow = swipe && action.destructive && action.asksFirst;
  const color = keepsRow ? SYSTEM_COLORS.red : action.tint;
  return (
    <Button
      key={action.label}
      label={action.label}
      systemImage={action.icon}
      role={action.destructive && !keepsRow ? "destructive" : undefined}
      onPress={action.onPress}
      modifiers={color ? [tint(color)] : undefined}
    />
  );
}

// iOS: the swipe actions and the long-press context menu of a list row, as in Mail, Reminders and
// Notes. Destructive actions are red and come last in the menu.
export function RowActions({ leading, trailing, menu, children }: RowActionsProps) {
  const row = menu?.length ? (
    <ContextMenu>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Items>{menu.map((action) => actionButton(action, false))}</ContextMenu.Items>
    </ContextMenu>
  ) : (
    children
  );

  if (!leading?.length && !trailing?.length) return row;

  return (
    <SwipeActions>
      {row}
      {leading?.length ? (
        <SwipeActions.Actions edge="leading">
          {leading.map((action) => actionButton(action, true))}
        </SwipeActions.Actions>
      ) : null}
      {trailing?.length ? (
        <SwipeActions.Actions edge="trailing">
          {trailing.map((action) => actionButton(action, true))}
        </SwipeActions.Actions>
      ) : null}
    </SwipeActions>
  );
}
