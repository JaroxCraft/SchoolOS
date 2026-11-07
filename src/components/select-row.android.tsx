import type { PickerItemValue } from "@expo/ui";
import { DropdownMenu, DropdownMenuItem, Icon, Row, Spacer, Text } from "@expo/ui/jetpack-compose";
import { clickable, fillMaxWidth, padding, weight } from "@expo/ui/jetpack-compose/modifiers";
import * as Haptics from "expo-haptics";
import { useState } from "react";

import type { SelectRowProps } from "@/components/select-row";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Android: a list row with the label on the left and the chosen value with a dropdown arrow on the
// right; tapping it opens a Material menu anchored to the row, the chosen option marked. This
// replaces the large outlined dropdown field of the universal Picker, which looks like an input.
export function SelectRow<T extends PickerItemValue>({
  label,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  const ink = useInk();
  const [expanded, setExpanded] = useState(false);
  const arrow = useSymbol("chevron.down", "arrow_drop_down");
  const check = useSymbol("checkmark", "check");
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
      <DropdownMenu.Trigger>
        <Row
          verticalAlignment="center"
          modifiers={[fillMaxWidth(), clickable(() => setExpanded(true)), padding(0, 4, 0, 4)]}>
          {/* Without a typography the texts take the list item's own style, like the other rows */}
          <Text color={ink.label}>{label}</Text>
          <Spacer modifiers={[weight(1)]} />
          <Text color={ink.secondary}>{selected?.label ?? ""}</Text>
          {arrow && typeof arrow !== "string" && (
            <Icon source={arrow} size={24} tint={ink.secondary} />
          )}
        </Row>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <DropdownMenuItem
              key={String(option.value)}
              onClick={() => {
                setExpanded(false);
                if (isSelected) return;
                Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick);
                onChange(option.value);
              }}>
              <DropdownMenuItem.Text>
                <Text
                  color={isSelected ? ink.accent : ink.label}
                  style={{ typography: "bodyLarge" }}>
                  {option.label}
                </Text>
              </DropdownMenuItem.Text>
              {/* The chosen option carries a checkmark in the accent color */}
              {isSelected && check && typeof check !== "string" && (
                <DropdownMenuItem.TrailingIcon>
                  <Icon source={check} size={20} tint={ink.accent} />
                </DropdownMenuItem.TrailingIcon>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}
