import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "../../ThemeContext";

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Konfiguracija celog donjeg menija
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 75, // Dovoljno visoko da sve stane bez odsecanja
          paddingTop: 8, // Prostor iznad ikonica
          paddingBottom: 12, // Siguran prostor ispod teksta da ne pobegne sa ekrana
        },
        tabBarActiveTintColor: theme.accent, // Boja kada je tab selektovan
        tabBarInactiveTintColor: isDarkMode ? "#64748b" : "#94a3b8", // Boja kada tab nije selektovan

        // KLJUČNO PODEŠAVANJE ZA SLOVA DA SE VIDE LEPO I CELA:
        tabBarLabelStyle: {
          fontSize: 10, // Optimalna veličina slova za 5 tabova
          fontWeight: "600", // Malo deblja slova radi bolje čitljivosti
          marginTop: 4, // Razmak između ikonice i teksta
          width: "100%", // Tera tekst da koristi punu širinu taba
        },
      }}
    >
      {/* 1. DASHBOARD */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Feather name="monitor" size={20} color={color} />
          ),
        }}
      />

      {/* 2. TROŠKOVI */}
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Troškovi",
          tabBarIcon: ({ color }) => (
            <Feather name="dollar-sign" size={20} color={color} />
          ),
        }}
      />

      {/* 3. STATISTIKA */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Statistika",
          tabBarIcon: ({ color }) => (
            <Feather name="trending-up" size={20} color={color} />
          ),
        }}
      />

      {/* 4. PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={20} color={color} />
          ),
        }}
      />

      {/* 5. FAVORITI */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoriti",
          tabBarIcon: ({ color }) => (
            <Feather name="star" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
