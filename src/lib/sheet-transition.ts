// How long a sheet zooms back into its button after it was closed
const CLOSING_MS = 600;

let closingUntil = 0;

// A zoomed sheet was closed and is shrinking back into its button. Presenting another sheet in that
// time makes the closing one jump down and up instead of opening (react-native-screens queues it
// into the running transition), so the button waits.
export function markSheetClosing() {
  closingUntil = Date.now() + CLOSING_MS;
}

export function isSheetClosing() {
  return Date.now() < closingUntil;
}
