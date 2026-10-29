import { Button, Host } from "@expo/ui";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

type EmptyStateProps = {
  // SF Symbol on iOS, Material Symbol on Android
  icon?: SymbolViewProps["name"];
  title: string;
  message: string;
  // The next step, e.g. opening the settings to set up the timetable
  action?: { label: string; onPress: () => void };
};

// Centered placeholder for a screen without content, like ContentUnavailableView on iOS.
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <SymbolView name={icon} size={48} tintColor={colors.secondaryLabel} />}
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text selectable style={styles.message}>
          {message}
        </Text>
      </View>
      {action && (
        <Host matchContents>
          <Button label={action.label} onPress={action.onPress} />
        </Host>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  texts: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.label,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    color: colors.secondaryLabel,
    fontSize: 15,
    textAlign: "center",
  },
});
