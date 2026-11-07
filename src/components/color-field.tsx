import { ColorSwatches } from "@/components/color-swatches";

export type ColorFieldProps = {
  // "#RRGGBB"
  value: string;
  onChange: (color: string) => void;
  // Colors of other subjects (marked on Android, where the swatches are shown)
  usedColors?: string[];
};

// Android: Material has no system color picker, so the subject colors are offered as swatches.
export function ColorField({ value, onChange, usedColors }: ColorFieldProps) {
  return <ColorSwatches value={value} onChange={onChange} usedColors={usedColors} />;
}
