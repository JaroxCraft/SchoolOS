import { Icon } from "@expo/ui";
import { background, frame, shapes } from "@expo/ui/swift-ui/modifiers";

import type { RowSymbol } from "@/lib/row-action";

export function RowIcon({ sf, color }: RowSymbol) {
  return (
    <Icon
      name={sf}
      size={15}
      color="#FFFFFF"
      modifiers={[
        frame({ width: 29, height: 29 }),
        background(
          color,
          shapes.roundedRectangle({ cornerRadius: 7, roundedCornerStyle: "continuous" })
        ),
      ]}
    />
  );
}
