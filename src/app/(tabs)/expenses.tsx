import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

const KATEGORIJE = [
  { id: "Food", label: "Hrana", icon: "silverware-fork-knife" },
  { id: "Transport", label: "Prevoz", icon: "car-outline" },
  { id: "Rent", label: "Stanarina", icon: "home-variant-outline" },
  { id: "Social", label: "Izlasci", icon: "glass-wine" },
  { id: "Uni", label: "Faks", icon: "school-outline" },
  { id: "Other", label: "Ostalo", icon: "dots-horizontal-circle-outline" },
];

export default function ExpensesScreen() {
  const { theme, isDarkMode } = useTheme();

  const [iznos, setIznos] = useState("");
  const [naslov, setNaslov] = useState("");
  const [odabranaKategorija, setOdabranaKategorija] = useState("Food");
  const [beljeska, setBeljeska] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveExpense = async () => {
    if (!iznos || isNaN(Number(iznos)) || Number(iznos) <= 0) {
      Alert.alert("Greška", "Unesite ispravan iznos troška.");
      return;
    }
    if (!naslov.trim()) {
      Alert.alert("Greška", "Unesite šta ste kupili.");
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Greška", "Korisnik nije ulogovan.");
        return;
      }

      const trosakIznos = parseFloat(iznos);

      // 1. KORAK: Povuci trenutno stanje budžeta iz tabele Korisnici
      const { data: profil, error: profilError } = await supabase
        .from("Korisnici")
        .select("current_balance")
        .eq("id", user.id)
        .single();

      if (profilError) throw profilError;

      const trenutniBudzet = profil?.current_balance
        ? parseFloat(profil.current_balance)
        : 0;
      const noviBudzet = trenutniBudzet - trosakIznos;

      // 2. KORAK: Unesi novi trošak u tabelu "troskovi"
      const { error: trosakError } = await supabase.from("troskovi").insert([
        {
          user_id: user.id,
          naslov: naslov.trim(),
          iznos: trosakIznos,
          kategorija: odabranaKategorija,
          beljeska: beljeska.trim() || null,
        },
      ]);

      if (trosakError) throw trosakError;

      // 3. KORAK: Ažuriraj stanje u tabeli "Korisnici" sa novim smanjenim budžetom
      const { error: updateError } = await supabase
        .from("Korisnici")
        .update({ current_balance: noviBudzet })
        .eq("id", user.id);

      if (updateError) throw updateError;

      Alert.alert("Uspeh", "Trošak je uspešno zabeležen i budžet je ažuriran!");
      handleDiscard();
    } catch (error: any) {
      Alert.alert("Greška", "Čuvanje nije uspelo: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDiscard = () => {
    setIznos("");
    setNaslov("");
    setOdabranaKategorija("Food");
    setBeljeska("");
    Keyboard.dismiss();
  };

  const inputBg = isDarkMode ? "#1e293b" : "#f1f5f9";
  const placeholderTextColor = isDarkMode ? "#64748b" : "#94a3b8";
  const labelTextColor = isDarkMode ? "#94a3b8" : "#475569";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.headerQuestion, { color: labelTextColor }]}>
          Koliko ste potrošili?
        </Text>

        <View
          style={[styles.amountWrapper, { borderBottomColor: theme.accent }]}
        >
          <Text style={[styles.currencySymbol, { color: theme.text }]}>€</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            placeholder="0.00"
            placeholderTextColor={placeholderTextColor}
            keyboardType="numeric"
            value={iznos}
            onChangeText={(text) => setIznos(text)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <MaterialIcons name="bubble-chart" size={18} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {" "}
            Detalji troška
          </Text>
        </View>

        <Text style={[styles.fieldLabel, { color: labelTextColor }]}>
          Šta ste kupili?
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <MaterialCommunityIcons
            name="compass-outline"
            size={18}
            color={placeholderTextColor}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="npr. Kupovina namirnica"
            placeholderTextColor={placeholderTextColor}
            value={naslov}
            onChangeText={(text) => setNaslov(text)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <MaterialIcons name="grain" size={18} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {" "}
            Kategorija
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
          {KATEGORIJE.map((cat) => {
            const isSelected = odabranaKategorija === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  { backgroundColor: inputBg },
                  isSelected && { backgroundColor: theme.accent },
                ]}
                onPress={() => setOdabranaKategorija(cat.id)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={15}
                  color={isSelected ? "#fff" : theme.text}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: isSelected ? "#fff" : theme.text },
                  ]}
                >
                  {" "}
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <MaterialIcons name="notes" size={18} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {" "}
            Beleška (Opciono)
          </Text>
        </View>
        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Dodajte napomenu..."
            placeholderTextColor={placeholderTextColor}
            value={beljeska}
            onChangeText={(text) => setBeljeska(text)}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.accent }]}
          onPress={handleSaveExpense}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, { color: "#fff" }]}>
              Sačuvaj trošak
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={[styles.discardButtonText, { color: labelTextColor }]}>
            Poništi
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerQuestion: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  amountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1.5,
    alignSelf: "center",
    paddingHorizontal: 10,
    marginBottom: 30,
    width: "55%",
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: "600",
    marginRight: 6,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: "600",
    minWidth: 100,
    paddingVertical: 5,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 6,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    height: "100%",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: "31%",
    justifyContent: "center",
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  saveButton: {
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  discardButtonText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
