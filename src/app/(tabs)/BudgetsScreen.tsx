import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

const PERIODI = [
  { id: "weekly", label: "Nedeljno", days: 7 },
  { id: "monthly", label: "Mesečno", days: 30 },
  { id: "quarterly", label: "Tromesečno", days: 90 },
];

const KATEGORIJE_LIMITA = [
  { id: "Sve", label: "Sve ukupno" },
  { id: "Food", label: "Hrana" },
  { id: "Transport", label: "Prevoz" },
  { id: "Rent", label: "Stanarina" },
  { id: "Social", label: "Izlasci" },
  { id: "Uni", label: "Faks" },
  { id: "Other", label: "Ostalo" },
];

interface BudgetPlan {
  id: string;
  period: string;
  kategorija: string | null;
  limit_iznos: number;
  potroseno: number;
}

export default function BudgetsScreen() {
  const { theme, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [budzeti, setBudzeti] = useState<BudgetPlan[]>([]);

  // State za formu
  const [iznos, setIznos] = useState("");
  const [odabraniPeriod, setOdabraniPeriod] = useState("monthly");
  const [odabranaKategorija, setOdabranaKategorija] = useState("Sve");

  useEffect(() => {
    ucitajBudzete();
  }, []);

  const ucitajBudzete = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Povuci definisane limite
      const { data: planovi, error: planoviError } = await supabase
        .from("budzeti")
        .select("*")
        .eq("user_id", user.id);

      if (planoviError) throw planoviError;

      // 2. Povuci sve troškove korisnika u poslednjih 90 dana radi računanja progresa
      const granicaDevedesetDana = new Date();
      granicaDevedesetDana.setDate(granicaDevedesetDana.getDate() - 90);

      const { data: troskovi, error: troskoviError } = await supabase
        .from("troskovi")
        .select("iznos, kategorija, datum")
        .eq("user_id", user.id)
        .gte("datum", granicaDevedesetDana.toISOString());

      if (troskoviError) throw troskoviError;

      // 3. Spoj limite i realnu potrošnju
      const izracunatiBudzeti = (planovi || []).map((plan) => {
        const periodInfo = PERIODI.find((p) => p.id === plan.period);
        const granicaDatuma = new Date();
        granicaDatuma.setDate(
          granicaDatuma.getDate() - (periodInfo?.days || 30),
        );

        // Filtriraj troškove koji upadaju u ovaj period i kategoriju
        const relevantniTroskovi = (troskovi || []).filter((t) => {
          const proveraDatuma = new Date(t.datum) >= granicaDatuma;
          const proveraKategorije =
            plan.kategorija === null || t.kategorija === plan.kategorija;
          return proveraDatuma && proveraKategorije;
        });

        const sumaPotroseno = relevantniTroskovi.reduce(
          (acc, curr) => acc + (curr.iznos || 0),
          0,
        );

        return {
          id: plan.id,
          period: plan.period,
          kategorija: plan.kategorija,
          limit_iznos: parseFloat(plan.limit_iznos),
          potroseno: sumaPotroseno,
        };
      });

      setBudzeti(izracunatiBudzeti);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Greška", "Nije uspelo učitavanje budžeta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDodajLimit = async () => {
    if (!iznos || isNaN(Number(iznos)) || Number(iznos) <= 0) {
      Alert.alert("Greška", "Unesite ispravan iznos limita.");
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const katZaBazu =
        odabranaKategorija === "Sve" ? null : odabranaKategorija;

      const { error } = await supabase.from("budzeti").insert([
        {
          user_id: user.id,
          period: odabraniPeriod,
          kategorija: katZaBazu,
          limit_iznos: parseFloat(iznos),
        },
      ]);

      if (error) throw error;

      Alert.alert("Uspeh", "Plan budžetiranja uspešno kreiran!");
      setIznos("");
      Keyboard.dismiss();
      await ucitajBudzete();
    } catch (error: any) {
      Alert.alert("Greška", "Čuvanje limita nije uspelo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleObrisiLimit = async (id: string) => {
    Alert.alert("Brisanje", "Da li sigurno želiš da obrišeš ovaj limit?", [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const { error } = await supabase
              .from("budzeti")
              .delete()
              .eq("id", id);

            if (error) throw error;

            Alert.alert("Uspeh", "Limit je uspešno obrisan.");
            await ucitajBudzete();
          } catch (error: any) {
            Alert.alert(
              "Greška",
              "Nije uspelo brisanje limita: " + error.message,
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const inputBg = isDarkMode ? "#1e293b" : "#f1f5f9";
  const placeholderTextColor = isDarkMode ? "#64748b" : "#94a3b8";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Forma za dodavanje novog plana */}
      <View
        style={[
          styles.formCard,
          {
            backgroundColor: isDarkMode ? "#1e293b" : "#fff",
            borderColor: theme.border || "#e2e8f0",
          },
        ]}
      >
        <Text style={[styles.formTitle, { color: theme.text }]}>
          Novi Plan Budžetiranja 🎯
        </Text>

        {/* Unos Iznosa */}
        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <Text style={[styles.currency, { color: theme.text }]}>€</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Maksimalan iznos (npr. 150)"
            placeholderTextColor={placeholderTextColor}
            keyboardType="numeric"
            value={iznos}
            onChangeText={setIznos}
          />
        </View>

        {/* Odabir Perioda */}
        <Text style={[styles.label, { color: theme.text }]}>
          Vremenski period:
        </Text>
        <View style={styles.rowGrid}>
          {PERIODI.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.selectorButton,
                { backgroundColor: inputBg },
                odabraniPeriod === p.id && { backgroundColor: theme.accent },
              ]}
              onPress={() => setOdabraniPeriod(p.id)}
            >
              <Text
                style={{
                  color: odabraniPeriod === p.id ? "#fff" : theme.text,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Odabir Kategorije */}
        <Text style={[styles.label, { color: theme.text }]}>Kategorija:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollGrid}
        >
          {KATEGORIJE_LIMITA.map((k) => (
            <TouchableOpacity
              key={k.id}
              style={[
                styles.chipButton,
                { backgroundColor: inputBg },
                odabranaKategorija === k.id && {
                  backgroundColor: theme.accent,
                },
              ]}
              onPress={() => setOdabranaKategorija(k.id)}
            >
              <Text
                style={{
                  color: odabranaKategorija === k.id ? "#fff" : theme.text,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {k.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.accent }]}
          onPress={handleDodajLimit}
        >
          <Text style={styles.saveButtonText}>Postavi Limit</Text>
        </TouchableOpacity>
      </View>

      {/* Lista aktivnih budžeta sa progresom */}
      <Text style={[styles.listHeader, { color: theme.text }]}>
        Aktivni Limiti
      </Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.accent}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={budzeti}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={ucitajBudzete}
          renderItem={({ item }) => {
            const preostalo = item.limit_iznos - item.potroseno;
            const procenatPotroseno =
              item.limit_iznos > 0
                ? Math.min(item.potroseno / item.limit_iznos, 1)
                : 0;
            const prekoracio = preostalo < 0;

            return (
              <View
                style={[
                  styles.budgetCard,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.03)"
                      : "#f8fafc",
                    borderColor: theme.border || "#e2e8f0",
                  },
                ]}
              >
                <View style={styles.budgetCardHeader}>
                  <View>
                    <Text
                      style={[styles.budgetPeriodText, { color: theme.text }]}
                    >
                      {PERIODI.find((p) => p.id === item.period)?.label} limit
                    </Text>
                    <Text
                      style={[
                        styles.budgetCategoryText,
                        { color: theme.subText || "#64748b" },
                      ]}
                    >
                      Kategorija: {item.kategorija || "Sve ukupno"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleObrisiLimit(item.id)}>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color="#ef4444"
                    />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View
                  style={[
                    styles.progressBarContainer,
                    { backgroundColor: inputBg },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${procenatPotroseno * 100}%`,
                        backgroundColor: prekoracio ? "#ef4444" : theme.accent,
                      },
                    ]}
                  />
                </View>

                {/* Statistika za limit */}
                <View style={styles.budgetStatsRow}>
                  <Text style={[styles.statItemText, { color: theme.text }]}>
                    Potrošeno:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {item.potroseno.toFixed(2)} €
                    </Text>{" "}
                    / {item.limit_iznos} €
                  </Text>
                  <Text
                    style={[
                      styles.statItemText,
                      {
                        color: prekoracio ? "#ef4444" : "#10b981",
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {prekoracio
                      ? `Prekoračeno: ${(preostalo * -1).toFixed(2)} €`
                      : `Preostalo: ${preostalo.toFixed(2)} €`}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: theme.subText,
                marginTop: 30,
              }}
            >
              Nemate postavljenih limita. Definišite plan iznad!
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    // Dodat padding na vrhu koji rešava sabijenost ispod statusne linije i notch-a/kamere
    paddingTop: Platform.OS === "ios" ? 16 : 8,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  currency: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectorButton: {
    flex: 1,
    marginHorizontal: 3,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollGrid: {
    flexDirection: "row",
    marginBottom: 14,
  },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 34,
    justifyContent: "center",
  },
  saveButton: {
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  listHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  budgetCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  budgetCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  budgetPeriodText: {
    fontSize: 15,
    fontWeight: "700",
  },
  budgetCategoryText: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  budgetStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItemText: {
    fontSize: 12,
  },
});
