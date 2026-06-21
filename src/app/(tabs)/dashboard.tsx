import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // DODATO
import { useCallback, useState } from "react";

import { router } from "expo-router";
import {
  ActivityIndicator,
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
  naslov: string;
  datum: string;
}

export default function DashboardScreen() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);

  const [trenutniBalans, setTrenutniBalans] = useState(0);
  const [ukupnoPotroseno, setUkupnoPotroseno] = useState(0);
  const [poslednjiTroskovi, setPoslednjiTroskovi] = useState<Trosak[]>([]);
  const [glavniBudzet, setGlavniBudzet] = useState<BudgetPlan | null>(null);
  const [userName, setUserName] = useState("Korisnik"); // Default ime

  // KORISTIMO useFocusEffect UMESTO useEffect
  useFocusEffect(
    useCallback(() => {
      ucitajDashboardPodatke();
    }, []),
  );

  const ucitajDashboardPodatke = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.replace("/(auth)/login");
        return;
      }

      const userId = session.user.id;

      // 1. Povuci korisnika, troškove i BUDŽET paralelno
      const [korisnikRes, troskoviRes] = await Promise.all([
        supabase
          .from("Korisnici")
          .select("first_name, last_name, current_balance")
          .eq("id", userId)
          .single(),

        supabase
          .from("troskovi")
          .select("*")
          .eq("user_id", userId)
          .order("datum", { ascending: false }),
      ]);
      const budzetiRes = await supabase.from("budzeti").select("*");

      console.log("TEST BUDZETI:", budzetiRes);
      console.log("USER:", korisnikRes);
      console.log("TROSKOVI:", troskoviRes);
      console.log("BUDZETI:", budzetiRes);
      console.log("USER ID:", userId);
      console.log("KORISNIK:", korisnikRes.data);
      console.log("BUDZETI DATA:", budzetiRes.data);
      console.log("TROSKOVI DATA:", troskoviRes.data);

      // Obrada imena
      if (korisnikRes.data) {
        setUserName(
          `${korisnikRes.data.first_name} ${korisnikRes.data.last_name}`,
        );

        setTrenutniBalans(Number(korisnikRes.data.current_balance) || 0);
      }

      // Obrada troškova
      const sviTroskovi = troskoviRes.data || [];

      setPoslednjiTroskovi(sviTroskovi.slice(0, 3));

      const ukupno = sviTroskovi.reduce(
        (sum, trosak) => sum + Number(trosak.iznos || 0),
        0,
      );

      setUkupnoPotroseno(ukupno);

      // Obrada budžeta
      if (budzetiRes.data && budzetiRes.data.length > 0) {
        const b = budzetiRes.data[0];

        setGlavniBudzet({
          id: b.id,
          period: b.period,
          kategorija: b.kategorija,
          limit_iznos: Number(b.limit_iznos),
          potroseno: ukupnoPotroseno,
        });
      } else {
        setGlavniBudzet(null);
      }
    } catch (error) {
      console.error("Greška:", error);
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
              {userName} 👋
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
                <Text style={styles.statText}>
                  Mesečni trošak:{" "}
                  {ukupnoPotroseno.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </Text>
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
              onPress={() => router.push("/expenses")}
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
              onPress={() => router.push("/BudgetsScreen")}
            >
              <MaterialCommunityIcons name="target" size={26} color="#10b981" />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Postavi Limit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutButton, { backgroundColor: cardBg }]}
              onPress={() => router.push("/achievements")}
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
                    {trosak.naslov || trosak.kategorija}
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
          {poslednjiTroskovi.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/analytics")}
              style={{
                marginTop: 10,
                marginBottom: 20,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: theme.accent,
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Vidi sve troškove →
              </Text>
            </TouchableOpacity>
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
