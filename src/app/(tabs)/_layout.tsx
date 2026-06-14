import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6", // Aktivna plava
        tabBarInactiveTintColor: "#94a3b8", // Svetlo siva koja se odlično vidi
        tabBarStyle: {
          backgroundColor: "#111c24", // Tamna pozadina menija
          borderTopWidth: 0,
          height: 72, // Povećavamo visinu sa 68 na 72 da rešimo sečenje
          paddingBottom: 12, // Dajemo jasan prostor tekstu na dnu
          paddingTop: 8, // Prostor za ikonice na vrhu
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          margin: 0, // Resetujemo sve spoljne margine
          padding: 0, // Resetujemo unutrašnji prostor
          minHeight: 14, // Garantujemo minimalnu visinu za ispis celih slova
        },
        tabBarIconStyle: {
          marginBottom: 2, // Lagano odvajamo ikonicu od teksta ispod nje
        },
        headerShown: false,
      }}
    >
      {/* 1. Dashboard (Tanka i moderna ikona monitora) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="monitor" size={22} color={color} />
          ),
        }}
      />

      {/* 2. Troškovi (Prefinjeni znak dolara) */}
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Troškovi",
          tabBarIcon: ({ color }) => (
            <Feather name="dollar-sign" size={22} color={color} />
          ),
        }}
      />

      {/* 3. Statistika (Elegantan grafik sa krivom linijom) */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Statistika",
          tabBarIcon: ({ color }) => (
            <Feather name="trending-up" size={22} color={color} />
          ),
        }}
      />

      {/* 4. Profil (Okrugla moderna ikonica korisnika) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />

      {/* 5. Favoriti (Tanka, elegantna zvezdica) */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoriti",
          tabBarIcon: ({ color }) => (
            <Feather name="star" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
