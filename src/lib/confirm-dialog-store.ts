import { useSyncExternalStore } from "react";

export type ConfirmOptions = {
  title: string;
  message: string;
  // Label of the button that carries out the action, e.g. "Löschen"
  confirmLabel: string;
  onConfirm: () => void;
  // Shows the confirm label in red on iOS (default true)
  destructive?: boolean;
  // A plain message with a single button, without "Abbrechen"
  messageOnly?: boolean;
};

// The confirmation shown by <ConfirmDialog> on Android, null while none is open.
let current: ConfirmOptions | null = null;
const listeners = new Set<() => void>();

function set(options: ConfirmOptions | null) {
  current = options;
  listeners.forEach((listener) => listener());
}

export const showConfirmDialog = (options: ConfirmOptions) => set(options);
export const closeConfirmDialog = () => set(null);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConfirmDialog(): ConfirmOptions | null {
  return useSyncExternalStore(subscribe, () => current);
}
