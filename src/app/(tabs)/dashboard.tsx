import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

interface BudgetPlan {
  id: string;
  period: string;
  kategorija: string | null;
  limit_iznos: number;
  potroseno: number;
}

interface Trosak {
  id: string;
  iznos: number;
  kategorija: string;
  opis: string;
  datum: string;
}

export default function DashboardScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);

  // State za podatke
  const [trenutniBalans, setTrenutniBalans] = useState(2112223.0); // Dinamički balans
  const [poslednjiTroskovi, setPoslednjiTroskovi] = useState<Trosak[]>([]);
  const [glavniBudzet, setGlavniBudzet] = useState<BudgetPlan | null>(null);

  useEffect(() => {
    ucitajDashboardPodatke();
  }, []);

  const ucitajDashboardPodatke = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Povuci poslednja 3 troška za brzi pregled
      const { data: troskoviData, error: troskoviError } = await supabase
        .from("troskovi")
        .select("*")
        .eq("user_id", user.id)
        .order("datum", { ascending: false })
        .limit(3);

      if (troskoviError) throw troskoviError;
      setPoslednjiTroskovi(troskoviData || []);

      // 2. Povuci budžete da bismo prikazali onaj sa najvećim progresom na početnoj
      const { data: budzetiData, error: budzetiError } = await supabase
        .from("budzeti")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (budzetiError) throw budzetiError;

      if (budzetiData && budzetiData.length > 0) {
        // Ovde povlačimo podatke i osiguravamo tipove podataka kroz parseFloat
        setGlavniBudzet({
          id: budzetiData[0].id,
          period: budzetiData[0].period,
          kategorija: budzetiData[0].kategorija,
          limit_iznos: parseFloat(budzetiData[0].limit_iznos),
          potroseno: 3845.0, // Primer potrošnje iz analitike
        });
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Greška", "Nije uspelo učitavanje početne strane.");
    } finally {
      setLoading(false);
    }
  };

  const inputBg = isDarkMode ? "#1e293b" : "#f1f5f9";
  const cardBg = isDarkMode ? "#1e293b" : "#fff";

  // --- DINAMIČKA LOGIKA ZA STATUS BUDŽETA ---
  let procenatProgresa = 0;
  let jePrekoraceno = false;
  let statusTekst = "U okviru limita";
  let statusBoja = "#10b981"; // Zelena boja po defaultu

  if (glavniBudzet) {
    const potrosenoNum = Math.abs(glavniBudzet.potroseno);
    const limitNum = glavniBudzet.limit_iznos;

    jePrekoraceno = potrosenoNum > limitNum;
    statusTekst = jePrekoraceno ? "Prekoračeno" : "U okviru limita";
    statusBoja = jePrekoraceno ? "#ef4444" : "#10b981"; // Crvena ako je prešao limit, zelena ako nije

    // Računanje procenta širine (maksimalno do 100%)
    procenatProgresa =
      limitNum > 0 ? Math.min((potrosenoNum / limitNum) * 100, 100) : 0;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.accent}
          style={styles.loader}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Gornji deo ekrana - Pozdrav */}
          <View style={styles.header}>
            <Text
              style={[
                styles.welcomeText,
                { color: theme.subText || "#64748b" },
              ]}
            >
              Dobrodošao nazad,
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              Lazar Jovanović 👋
            </Text>
          </View>

          {/* Glavna kartica sa stanjem (Balans) */}
          <View style={[styles.balanceCard, { backgroundColor: theme.accent }]}>
            <Text style={styles.balanceLabel}>Ukupan preostali budžet</Text>
            <Text style={styles.balanceAmount}>
              {trenutniBalans.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
              })}{" "}
              €
            </Text>
            <View style={styles.balanceStats}>
              <View style={styles.statRow}>
                <MaterialCommunityIcons
                  name="arrow-down-bold-circle"
                  size={18}
                  color="#fca5a5"
                />
                <Text style={styles.statText}>Mesečni trošak: 3.845,00 €</Text>
              </View>
            </View>
          </View>

          {/* Aktivni Limit / Progres bar koji sada ispravno radi */}
          {glavniBudzet && (
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: cardBg,
                  borderColor: theme.border || "#e2e8f0",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Status Budžeta 🎯
              </Text>
              <View style={styles.budgetProgressRow}>
                <Text style={[styles.budgetText, { color: theme.text }]}>
                  Mesečni limit ({glavniBudzet.kategorija || "Sve ukupno"})
                </Text>
                {/* Dinamički tekst i dinamička boja statusa */}
                <Text style={[styles.budgetPercent, { color: statusBoja }]}>
                  {statusTekst}
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: inputBg },
                ]}
              >
                {/* Dinamička širina i dinamička boja staze */}
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${procenatProgresa}%`,
                      backgroundColor: statusBoja,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.statItemText, { color: theme.subText }]}>
                Potrošeno:{" "}
                <Text style={{ fontWeight: "700", color: theme.text }}>
                  {glavniBudzet.potroseno.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </Text>{" "}
                /{" "}
                {glavniBudzet.limit_iznos.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </Text>
            </View>
          )}

          {/* Brze Akcije / Prečice */}
          <Text style={[styles.labelTitle, { color: theme.text }]}>
            Brze Prečice
          </Text>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[styles.shortcutButton, { backgroundColor: cardBg }]}
              onPress={() => navigation.navigate("Troškovi")}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={26}
                color={theme.accent}
              />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Dodaj Trošak
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutButton, { backgroundColor: cardBg }]}
              onPress={() => navigation.navigate("Budžeti")}
            >
              <MaterialCommunityIcons name="target" size={26} color="#10b981" />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Postavi Limit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutButton, { backgroundColor: cardBg }]}
              onPress={() => navigation.navigate("Nagrade")}
            >
              <MaterialCommunityIcons name="trophy" size={26} color="#f59e0b" />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Postignuća
              </Text>
            </TouchableOpacity>
          </View>

          {/* Poslednje Transakcije */}
          <Text style={[styles.labelTitle, { color: theme.text }]}>
            Poslednje aktivnosti
          </Text>
          {poslednjiTroskovi.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              Nema nedavnih troškova.
            </Text>
          ) : (
            poslednjiTroskovi.map((trosak) => (
              <View
                key={trosak.id}
                style={[styles.trosakRow, { backgroundColor: cardBg }]}
              >
                <View
                  style={[styles.trosakIconBg, { backgroundColor: inputBg }]}
                >
                  <MaterialCommunityIcons
                    name={
                      trosak.kategorija === "Food"
                        ? "food"
                        : "credit-card-outline"
                    }
                    size={20}
                    color={theme.text}
                  />
                </View>
                <View style={styles.trosakInfo}>
                  <Text style={[styles.trosakOpis, { color: theme.text }]}>
                    {trosak.opis || trosak.kategorija}
                  </Text>
                  <Text style={[styles.trosakDatum, { color: theme.subText }]}>
                    {new Date(trosak.datum).toLocaleDateString("sr-RS")}
                  </Text>
                </View>
                <Text style={styles.trosakIznos}>
                  -{trosak.iznos.toFixed(2)} €
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    marginTop: 15,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 5,
    letterSpacing: -0.5,
  },
  balanceStats: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  budgetProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  budgetPercent: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statItemText: {
    fontSize: 12,
  },
  labelTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 5,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shortcutButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  trosakRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  trosakIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  trosakInfo: {
    flex: 1,
  },
  trosakOpis: {
    fontSize: 14,
    fontWeight: "600",
  },
  trosakDatum: {
    fontSize: 11,
    marginTop: 2,
  },
  trosakIznos: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 10,
    fontStyle: "italic",
  },
});
