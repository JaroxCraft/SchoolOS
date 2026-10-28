import { Row } from "@expo/ui";

export function SubjectDot({ color }: { color: string }) {
  return <Row style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />;
}
