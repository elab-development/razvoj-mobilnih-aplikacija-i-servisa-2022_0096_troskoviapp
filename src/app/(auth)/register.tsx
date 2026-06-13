import { Href, router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  // Stanja za formu
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  // Stanja za UI (Zahtev br. 7)
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    // Resetuj greške pre početka akcije
    setErrorMessage(null);

    // Bazična validacija polja
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phone ||
      !currentBalance
    ) {
      setErrorMessage("Molimo vas da popunite sva polja.");
      return;
    }

    setLoading(true);

    try {
      // Ovde će u narednim koracima doći direktno povezivanje sa Supabase platformom
      console.log("Slanje podataka na backend:", {
        email,
        password,
        firstName,
        lastName,
        phone,
        currentBalance: parseFloat(currentBalance),
      });

      // Simulacija mrežnog zahteva (traje 2 sekunde)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Uspešno izvršeno -> Preusmeravanje korisnika na login stranicu
      router.replace("/login" as Href);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Došlo je do greške prilikom registracije.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Kreiraj Nalog</Text>
        <Text style={styles.subtitle}>
          Unesite podatke kako biste započeli praćenje troškova
        </Text>

        {/* Prikaz korisničke poruke o grešci (Zahtev br. 7) */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Ime"
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Prezime"
          value={lastName}
          onChangeText={(text) => setLastName(text)}
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail adresa"
          value={email}
          onChangeText={(text) => setEmail(text)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Broj telefona"
          value={phone}
          onChangeText={(text) => setPhone(text)}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Početno stanje budžeta (Current Balance)"
          value={currentBalance}
          onChangeText={(balance) => setCurrentBalance(balance)}
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Lozinka"
          value={password}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
          placeholderTextColor="#aaa"
        />

        {/* Dugme sa indikatorom učitavanja (Zahtev br. 7) */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registruj se</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Nazad na početnu</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
  button: {
    height: 55,
    backgroundColor: "#6200ee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#b39ddb",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#6200ee",
    fontSize: 14,
    fontWeight: "500",
  },
});
