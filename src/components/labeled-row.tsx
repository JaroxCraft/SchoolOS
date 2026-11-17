import { Row, Spacer, Text } from "@expo/ui";
import type { ReactNode } from "react";

import { useInk } from "@/hooks/use-ink";

type LabeledRowProps = {
  label: string;
  children: ReactNode;
};

export function LabeledRow({ label, children }: LabeledRowProps) {
  const ink = useInk();

  return (
    <Row alignment="center">
      <Text textStyle={{ color: ink.label }}>{label}</Text>
      <Spacer flexible />
      {children}
    </Row>
  );
}
