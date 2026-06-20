import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "./supabaseClient";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    console.log("RESET SCREEN OTVOREN");
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert("Greška", "Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Greška", "Lozinke se ne poklapaju.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      Alert.alert("Greška", error.message);
      return;
    }

    Alert.alert("Uspeh", "Lozinka je uspešno promenjena.", [
      {
        text: "OK",
        onPress: () => router.replace("/(auth)/login"),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova lozinka</Text>

      <TextInput
        style={styles.input}
        placeholder="Nova lozinka"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Potvrdi lozinku"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
        <Text style={styles.buttonText}>Sačuvaj novu lozinku</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#6200ee",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});
