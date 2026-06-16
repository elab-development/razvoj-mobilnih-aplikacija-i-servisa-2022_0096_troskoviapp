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
          height: 80, // Blago povećano da 6 tabova stane bez gužvanja
          paddingTop: 8, // Prostor iznad ikonica
          paddingBottom: 14, // Siguran prostor ispod teksta
        },
        tabBarActiveTintColor: theme.accent, // Boja kada je tab selektovan
        tabBarInactiveTintColor: isDarkMode ? "#64748b" : "#94a3b8", // Boja kada tab nije selektovan

        // KLJUČNO PODEŠAVANJE ZA SLOVA DA SE VIDE LEPO I CELA:
        tabBarLabelStyle: {
          fontSize: 9.5, // Blago smanjeno jer sada imamo 6 tabova u nizu
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

      {/* 4. BUDŽETI */}
      <Tabs.Screen
        name="BudgetsScreen"
        options={{
          title: "Budžeti",
          tabBarIcon: ({ color }) => (
            <Feather name="pie-chart" size={20} color={color} />
          ),
        }}
      />

      {/* 5. NAGRADE (ACHIEVEMENTS) */}
      <Tabs.Screen
        name="achievements"
        options={{
          title: "Nagrade",
          tabBarIcon: ({ color }) => (
            <Feather name="award" size={20} color={color} /> // Svečana ikonica pehara/nagrade
          ),
        }}
      />

      {/* 6. PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
