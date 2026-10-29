import { router } from "expo-router";
import { Alert } from "react-native";

// Asks before deleting the item of the current screen, then closes the screen and deletes it.
export function confirmDelete(title: string, message: string, onDelete: () => Promise<void>) {
  Alert.alert(title, message, [
    { text: "Abbrechen", style: "cancel" },
    {
      text: "Löschen",
      style: "destructive",
      onPress: async () => {
        router.back();
        await onDelete();
      },
    },
  ]);
}
