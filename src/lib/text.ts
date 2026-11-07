// Joins the details of a row with " · ", skipping empty ones. Nothing left gives undefined, so a
// row without details gets no empty second line (Android keeps one for an empty string).
export function joinDetails(...parts: (string | null | undefined)[]): string | undefined {
  return parts.filter(Boolean).join(" · ") || undefined;
}
