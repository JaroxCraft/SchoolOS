import { Icon } from "@expo/ui";
import { background, frame, shapes } from "@expo/ui/swift-ui/modifiers";

import type { RowSymbol } from "@/components/row-icon";

// iOS: a white SF Symbol centered on a colored rounded square, like the system Settings app. The
// square is the symbol's own frame with a background, so the symbol always sits in its center.
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
