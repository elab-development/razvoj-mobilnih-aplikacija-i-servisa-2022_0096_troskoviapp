import * as Notifications from "expo-notifications"; // Dodaj ovo
import { Stack } from "expo-router";
import { useEffect } from "react"; // Dodaj ovo
import { ThemeProvider } from "../ThemeContext";

Notifications.setNotificationHandler({
  // @ts-ignore
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  // Opciono: Možeš ovde dodati logiku za traženje permisija pri pokretanju
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permisije za notifikacije nisu dobijene!");
      }
    };
    requestPermissions();
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="dashboard" />
        {/* Ostale rute */}
      </Stack>
    </ThemeProvider>
  );
}
