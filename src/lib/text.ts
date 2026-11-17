// Joins the details of a row with " · ", skipping empty ones. Nothing left gives undefined, so a
// row without details gets no empty second line (Android keeps one for an empty string).
export function joinDetails(...parts: (string | null | undefined)[]): string | undefined {
  return parts.filter(Boolean).join(" · ") || undefined;
}

// A number with its noun, in the singular for exactly one: "1 Fach", "3 Fächer".
export function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// The Kürzel of a Fach left empty: the first three letters of its name ("Mathematik" → "Mat").
export const subjectAbbreviation = (name: string) => name.trim().slice(0, 3).trim();

// The Kürzel of a Lehrperson left empty, as schools write them: the first letter of the first name
// and the first two letters of the last name ("Julian Riegger" → "JRi"). A single name gives its
// first three letters, like a Fach.
export function teacherAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return subjectAbbreviation(name);
  return words[0].charAt(0).toUpperCase() + words.at(-1)!.slice(0, 2);
}
