import { ENTRY_TYPES, type EntryType } from "@/db/schema";
import { t } from "@/i18n";

type EntryTypeInfo = {
  label: string;
  titlePlaceholder: string;
  gradable: boolean;
};

const GRADABLE: Record<EntryType, boolean> = {
  homework: false,
  exam: true,
  presentation: true,
  submission: true,
  other: false,
};

export const ENTRY_TYPE_INFO = Object.fromEntries(
  ENTRY_TYPES.map((type) => [type, { ...t.entries.types[type], gradable: GRADABLE[type] }])
) as Record<EntryType, EntryTypeInfo>;

export const ENTRY_TYPE_OPTIONS = ENTRY_TYPES.map((type) => ({
  label: ENTRY_TYPE_INFO[type].label,
  value: type,
}));

export const NO_SUBJECT_LABEL = t.entries.noSubject;
