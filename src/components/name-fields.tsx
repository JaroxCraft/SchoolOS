import { TextField } from "@/components/text-field";
import { t } from "@/i18n";

// The rules of the name and abbreviation of a subject and a teacher, shared by their forms.

type AbbreviationFieldProps = {
  name: string;
  // Makes the abbreviation from the name, e.g. subjectAbbreviation
  makeAbbreviation: (name: string) => string;
  // The placeholder while there is no name yet, e.g. "Abbreviation, e.g. M"
  example: string;
  defaultValue: string;
  autoCapitalize: "characters" | "none";
  onChangeText: (abbreviation: string) => void;
};

// The abbreviation field: its placeholder shows the abbreviation made from the name, which is
// saved when the field is left empty (abbreviationToSave)
export function AbbreviationField({
  name,
  makeAbbreviation,
  example,
  ...props
}: AbbreviationFieldProps) {
  return (
    <TextField
      placeholder={name.trim() ? t.school.abbreviationPlaceholder(makeAbbreviation(name)) : example}
      maxLength={5}
      {...props}
    />
  );
}

// The abbreviation to save: the one typed, or else the one made from the name
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
