// How long a sheet closed from JS (×, ✓) zooms back into its button at most. Its screen is unmounted
// right away, so the end of that transition is never reported.
const SHRINKING_MS = 1000;

let held = false;
let closingUntil = 0;

// A zoomed sheet is closing and shrinks back into its button. Presenting another sheet in that time
// makes the closing one jump down and up instead of opening (react-native-screens queues it into
// the running transition), so the button waits while isSheetClosing() is true.

// Swiping the sheet down has started; closing until releaseSheetClosing
export function holdSheetClosing() {
  held = true;
}

// The sheet is gone, or (stillShrinking) it was closed from JS and still shrinks back
export function releaseSheetClosing(stillShrinking: boolean) {
  held = false;
  closingUntil = stillShrinking ? Date.now() + SHRINKING_MS : 0;
}

export function isSheetClosing() {
  return held || Date.now() < closingUntil;
}
