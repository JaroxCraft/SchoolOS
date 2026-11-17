import { useState } from "react";

// The value, or the last one that was defined once it is gone. A deleted item stays on its screen
// while the screen closes, instead of an empty title or a "not found" message.
export function useLastDefined<T>(value: T | undefined): T | undefined {
  const [last, setLast] = useState(value);
  if (value !== undefined && value !== last) setLast(value);
  return value ?? last;
}
