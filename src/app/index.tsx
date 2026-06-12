import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      {/* Gornji deo sa tekstom ili dobrodošlicom */}
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Dobrodošli u TroškoviApp</Text>
        <Text style={styles.subtitle}>
          Jednostavno pratite i upravljajte svojim studentskim troškovima.
        </Text>
      </View>

      {/* Donji deo sa dugmićima */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => console.log("Login pritisnut")}
        >
          <Text style={styles.loginButtonText}>Prijavi se</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => console.log("Register pritisnut")}
        >
          <Text style={styles.registerButtonText}>Registruj se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  welcomeSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 15, // Pravi razmak između dugmića
  },
  button: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Senka za Android
  },
  loginButton: {
    backgroundColor: "#6200ee", // Glavna primarna boja
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#6200ee",
  },
  registerButtonText: {
    color: "#6200ee",
    fontSize: 16,
    fontWeight: "600",
  },
});
