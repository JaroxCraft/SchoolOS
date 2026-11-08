import { Stack } from "expo-router";
import type { ReactNode } from "react";

import { FormList } from "@/components/form-list";
import { useSaveButton } from "@/hooks/use-header-button";

export type SheetFormProps = {
  title: string;
  canSave: boolean;
  onSave: () => void;
  // The sections of the form
  children: ReactNode;
};

// A form opened as a sheet, e.g. an entry. Android: the title and the check icon in the header,
// the back arrow leaves. iOS: sheet-form.ios.tsx.
export function SheetForm({ title, canSave, onSave, children }: SheetFormProps) {
  const saveButton = useSaveButton();

  return (
    <>
      <Stack.Title>{title}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && (
          <Stack.Toolbar.Button {...saveButton} disabled={!canSave} onPress={onSave} />
        )}
      </Stack.Toolbar>
      <FormList>{children}</FormList>
    </>
  );
}
