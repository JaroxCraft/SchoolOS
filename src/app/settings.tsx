import { router, Stack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { EmptyState } from "@/components/empty-state";

export default function SettingsScreen() {
  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <EmptyState
          title="Einstellungen"
          message="Hier erfasst du bald Lektionenraster, Fächer, Stundenplan, Semester und Benachrichtigungen."
        />
      </ScrollView>
      <Stack.Title>Einstellungen</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button variant="done" onPress={() => router.back()}>
          Fertig
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
