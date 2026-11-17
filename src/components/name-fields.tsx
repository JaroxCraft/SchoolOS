import { TextField } from "@/components/text-field";

// The rules of the name and Kürzel of a Fach and a Lehrperson, shared by their forms.

type AbbreviationFieldProps = {
  // The name typed so far
  name: string;
  // Makes the Kürzel from the name, e.g. subjectAbbreviation
  makeAbbreviation: (name: string) => string;
  // The placeholder while there is no name yet, e.g. "Kürzel, z. B. M"
  example: string;
  defaultValue: string;
  autoCapitalize: "characters" | "none";
  onChangeText: (abbreviation: string) => void;
};

// The Kürzel field: its placeholder shows the Kürzel made from the name, which is saved when the
// field is left empty (abbreviationToSave)
export function AbbreviationField({
  name,
  makeAbbreviation,
  example,
  ...props
}: AbbreviationFieldProps) {
  return (
    <TextField
      placeholder={name.trim() ? `Kürzel (sonst «${makeAbbreviation(name)}»)` : example}
      maxLength={5}
      {...props}
    />
  );
}

// The Kürzel to save: the one typed, or else the one made from the name
export function abbreviationToSave(
  abbreviation: string,
  name: string,
  makeAbbreviation: (name: string) => string
): string {
  return abbreviation.trim() || makeAbbreviation(name.trim());
}

// ✓ only while there is something to save, and never without a name
export function canSaveNamed(dirty: boolean, name: string): boolean {
  return dirty && name.trim().length > 0;
}
