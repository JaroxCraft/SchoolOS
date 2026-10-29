// Joins the details of a row with " · ", skipping empty ones.
export function joinDetails(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}
