import { Href, router } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../ThemeContext"; // 1. Uvezi našu temu (prilagodi putanju ako treba)
import { supabase } from "../supabaseClient";

export default function DashboardScreen() {
  const { theme } = useTheme(); // 2. Izvuci trenutne boje teme

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/(auth)/login" as Href);
    } catch (error: any) {
      Alert.alert("Greška", "Nije uspela odjava: " + error.message);
    }
  };

  return (
    // 3. Primijeni dinamičku pozadinu
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 4. Primijeni dinamičku boju teksta */}
      <Text style={[styles.title, { color: theme.text }]}>
        Dobrodošli na Dashboard! 🎉
      </Text>

      <Text style={[styles.subtitle, { color: theme.subText }]}>
        Ovde ćemo kasnije prikazivati vaše troškove i grafike.
      </Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Odjavi se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
