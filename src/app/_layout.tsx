import { Stack } from "expo-router";
import { ThemeProvider } from "../ThemeContext"; // Uvozimo naš kontekst za temu

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="dashboard" />
      </Stack>
    </ThemeProvider>
  );
}
