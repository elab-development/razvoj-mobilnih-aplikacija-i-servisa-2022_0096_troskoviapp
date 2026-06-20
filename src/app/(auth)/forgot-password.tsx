import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../supabaseClient";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Greška", "Unesite email adresu.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {});

      if (error) throw error;

      Alert.alert("Uspeh", "Poslali smo vam email za resetovanje lozinke.");
    } catch (error: any) {
      Alert.alert("Greška", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 25,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Zaboravljena lozinka
      </Text>

      <Text
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: 25,
        }}
      >
        Unesite email adresu povezanu sa nalogom.
      </Text>

      <TextInput
        placeholder="E-mail adresa"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 15,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={loading}
        style={{
          backgroundColor: "#6200ee",
          padding: 15,
          borderRadius: 10,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Pošalji link
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login")}
        style={{
          marginTop: 20,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "#6200ee",
            fontWeight: "600",
            fontSize: 16,
          }}
        >
          Nazad na prijavu
        </Text>
      </TouchableOpacity>
    </View>
  );
}
