import { Stack } from "expo-router";
import type { ReactNode } from "react";

import { DiscardGuard } from "@/components/discard-guard";
import { FormList } from "@/components/form-list";
import { useSaveButton } from "@/hooks/use-header-button";

type PushedFormProps = {
  title: string;
  canSave: boolean;
  // Unsaved changes: leaving asks first (see DiscardGuard). The screen passes the same value to
  // useClosingForm or useDiscardGuard.
  dirty: boolean;
  // ✓ "Sichern" at the top right; left out in a setup step, whose button in `toolbar` saves
  onSave?: () => void;
  // More buttons at the top right, before ✓, e.g. "Weiter" of a setup step. <Stack.Toolbar.Button>
  // elements, not wrapped in another component: iOS ignores those.
  toolbar?: ReactNode;
  children: ReactNode;
};

// A form pushed onto the stack, e.g. a subject or the period grid: the title and ✓ in the
// navigation bar, and the form, guarded against leaving it with unsaved changes. A form opened as
// a sheet uses <SheetForm>.
export function PushedForm({ title, canSave, dirty, onSave, toolbar, children }: PushedFormProps) {
  const saveButton = useSaveButton();

  return (
    <>
      <Stack.Title>{title}</Stack.Title>
      <Stack.Toolbar placement="right">
        {toolbar}
        {onSave && saveButton && (
          <Stack.Toolbar.Button {...saveButton} disabled={!canSave} onPress={onSave} />
        )}
      </Stack.Toolbar>
      <DiscardGuard dirty={dirty}>
        <FormList>{children}</FormList>
      </DiscardGuard>
    </>
  );
}
