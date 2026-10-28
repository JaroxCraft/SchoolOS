import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { SettingsButton } from "@/components/settings-button";

type ScreenProps = {
  title: string;
  children: ReactNode;
};

export function Screen({ title, children }: ScreenProps) {
  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      <Stack.Title large>{title}</Stack.Title>
      <SettingsButton />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
