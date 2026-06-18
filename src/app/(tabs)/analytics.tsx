import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [ukupnoPotroseno, setUkupnoPotroseno] = useState<number>(0);
  const [preostaliBudzet, setPreostaliBudzet] = useState<number>(0);
  const [procenatPotrosenoLimit, setProcenatPotrosenoLimit] =
    useState<number>(0);
  const [procenatPotrosenoBudzet, setProcenatPotrosenoBudzet] =
    useState<number>(0);

  const PODRAZUMEVANI_BUDZET = 500;
  const MESECNI_LIMIT = 5000;

  // Dimenzije za manje grafikone kako bi stali jedan pored drugog
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    izracunajAnalitiku();
  }, []);

  const izracunajAnalitiku = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        if (Platform.OS === "web") alert("Korisnik nije ulogovan.");
        else Alert.alert("Greška", "Korisnik nije ulogovan.");
        return;
      }

      const { data: profil, error: profilError } = await supabase
        .from("Korisnici")
        .select("current_balance")
        .eq("id", user.id)
        .single();

      if (profilError && profilError.code !== "PGRST") {
        console.warn("Profil greška:", profilError);
      }

      const trenutniPreostaliBudzet = profil?.current_balance
        ? parseFloat(profil.current_balance)
        : PODRAZUMEVANI_BUDZET;

      const { data: troskovi, error: troskoviError } = await supabase
        .from("troskovi")
        .select("iznos")
        .eq("user_id", user.id);

      if (troskoviError) throw troskoviError;

      const sumaTroskova = (troskovi || []).reduce(
        (acc, curr) => acc + Math.abs(parseFloat(curr.iznos || 0)),
        0,
      );

      // 1. Procenat potrošnje u odnosu na Mesečni Limit
      const izracunatProcenatLimit =
        MESECNI_LIMIT > 0
          ? Math.min(Math.round((sumaTroskova / MESECNI_LIMIT) * 100), 100)
          : 0;

      // 2. Procenat potrošnje u odnosu na Ukupni Budžet (Balans + Troškovi)
      const ukupanPocetniBudzet = trenutniPreostaliBudzet + sumaTroskova;
      const izracunatProcenatBudzet =
        ukupanPocetniBudzet > 0
          ? Math.min(
              Math.round((sumaTroskova / ukupanPocetniBudzet) * 100),
              100,
            )
          : 0;

      setUkupnoPotroseno(sumaTroskova);
      setPreostaliBudzet(
        trenutniPreostaliBudzet < 0 ? 0 : trenutniPreostaliBudzet,
      );
      setProcenatPotrosenoLimit(izracunatProcenatLimit);
      setProcenatPotrosenoBudzet(izracunatProcenatBudzet);
    } catch (error: any) {
      console.error("Greška u analitici:", error);
      if (Platform.OS === "web") {
        alert("Nije uspelo učitavanje analitike: " + error.message);
      } else {
        Alert.alert(
          "Greška",
          "Nije uspelo učitavanje analitike: " + error.message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Izračunavanje staza za oba grafikona
  const strokeDashoffsetLimit =
    circumference - (procenatPotrosenoLimit / 100) * circumference;

  const strokeDashoffsetBudzet =
    circumference - (procenatPotrosenoBudzet / 100) * circumference;

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.background || "#111c24" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent || "#6200ee"} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background || "#111c24" },
      ]}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text || "#fff" }]}>
            Analitika Troškova 📊
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.subText || "#94a3b8" }]}
          >
            Pregled stanja prilagođen tvom uređaju
          </Text>
        </View>

        {/* Kontejner koji poravnava dva grafikona jedan pored drugog */}
        <View style={styles.chartsRow}>
          {/* PRVI GRAFIKON: Troškovi / Limit (Plavo-Zeleni) */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#ef4444"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#3b82f6" // Promenjeno u plavu boju prema tvom zahtevu
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffsetLimit}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </Svg>
              <View style={styles.absoluteCenter}>
                <Text
                  style={[styles.procenatText, { color: theme.text || "#fff" }]}
                >
                  {procenatPotrosenoLimit}%
                </Text>
              </View>
            </View>
            <Text
              style={[styles.chartLabel, { color: theme.subText || "#94a3b8" }]}
            >
              Potrošeno / Limit
            </Text>
          </View>

          {/* DRUGI GRAFIKON: Troškovi / Ukupan Budžet */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#10b981"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#ef4444"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffsetBudzet}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </Svg>
              <View style={styles.absoluteCenter}>
                <Text
                  style={[styles.procenatText, { color: theme.text || "#fff" }]}
                >
                  {procenatPotrosenoBudzet}%
                </Text>
              </View>
            </View>
            <Text
              style={[styles.chartLabel, { color: theme.subText || "#94a3b8" }]}
            >
              Potrošeno / Budžet
            </Text>
          </View>
        </View>

        {/* Indikatori i metrike */}
        <View style={styles.statsSection}>
          <View
            style={[
              styles.statRow,
              { borderBottomColor: theme.border || "#2e3b4e" },
            ]}
          >
            <View style={styles.statLabelContainer}>
              <View
                style={[styles.indicator, { backgroundColor: "#3b82f6" }]}
              />
              <Text style={[styles.statLabel, { color: theme.text || "#fff" }]}>
                Mesečni limit:
              </Text>
            </View>
            <Text style={[styles.statValue, { color: "#3b82f6" }]}>
              {MESECNI_LIMIT.toFixed(2)} €
            </Text>
          </View>

          <View
            style={[
              styles.statRow,
              { borderBottomColor: theme.border || "#2e3b4e" },
            ]}
          >
            <View style={styles.statLabelContainer}>
              <View
                style={[styles.indicator, { backgroundColor: "#ef4444" }]}
              />
              <Text style={[styles.statLabel, { color: theme.text || "#fff" }]}>
                Ukupno potrošeno:
              </Text>
            </View>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              -{ukupnoPotroseno.toFixed(2)} €
            </Text>
          </View>

          <View
            style={[
              styles.statRow,
              { borderBottomColor: theme.border || "#2e3b4e" },
            ]}
          >
            <View style={styles.statLabelContainer}>
              <View
                style={[styles.indicator, { backgroundColor: "#10b981" }]}
              />
              <Text style={[styles.statLabel, { color: theme.text || "#fff" }]}>
                Preostali budžet (Trenutno):
              </Text>
            </View>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {preostaliBudzet.toFixed(2)} €
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 15 : 25,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginTop: 15,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  chartsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  chartWrapper: {
    flex: 1,
    alignItems: "center",
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  absoluteCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  procenatText: {
    fontSize: 26, // Smanjen font da lepo stane u manji krug
    fontWeight: "800",
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statsSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  statLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "right",
    marginLeft: 10,
  },
});
