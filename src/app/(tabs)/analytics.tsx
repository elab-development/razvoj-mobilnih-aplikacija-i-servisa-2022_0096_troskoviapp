import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const [mesecniLimit, setMesecniLimit] = useState(0);
  const [troskovi, setTroskovi] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dimenzije za manje grafikone kako bi stali jedan pored drugog
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useFocusEffect(
    useCallback(() => {
      izracunajAnalitiku();
    }, []),
  );

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

      const { data: budzet, error: budzetError } = await supabase
        .from("budzeti")
        .select("limit_iznos")
        .eq("user_id", user.id)
        .is("kategorija", null)
        .maybeSingle();

      if (budzetError && budzetError.code !== "PGRST116") {
        console.warn("Budzet greska:", budzetError);
      }

      const limit = budzet?.limit_iznos || 0;

      setMesecniLimit(limit);

      if (profilError && profilError.code !== "PGRST") {
        console.warn("Profil greška:", profilError);
      }

      const trenutniPreostaliBudzet = profil?.current_balance
        ? parseFloat(profil.current_balance)
        : PODRAZUMEVANI_BUDZET;

      const { data: troskoviData, error: troskoviError } = await supabase
        .from("troskovi")
        .select("*")
        .eq("user_id", user.id)
        .order("datum", { ascending: false });

      if (troskoviError) throw troskoviError;

      const sumaTroskova = (troskoviData || []).reduce(
        (acc, curr) => acc + Math.abs(parseFloat(curr.iznos || 0)),
        0,
      );
      console.log("Budzet:", budzet);
      console.log("Limit:", limit);
      console.log("Ukupno potroseno:", sumaTroskova);
      setTroskovi(troskoviData || []);

      // 1. Procenat potrošnje u odnosu na Mesečni Limit
      const izracunatProcenatLimit =
        limit > 0 ? Math.min((sumaTroskova / limit) * 100, 100) : 0;

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

  const obrisiTrosak = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Pronađi trošak
      const { data: trosak, error: trosakError } = await supabase
        .from("troskovi")
        .select("iznos")
        .eq("id", id)
        .single();

      if (trosakError) throw trosakError;

      // Pronađi trenutni balans
      const { data: profil, error: profilError } = await supabase
        .from("Korisnici")
        .select("current_balance")
        .eq("id", user.id)
        .single();

      if (profilError) throw profilError;

      const noviBalans = Number(profil.current_balance) + Number(trosak.iznos);

      // Vrati novac na balans
      const { error: updateError } = await supabase
        .from("Korisnici")
        .update({
          current_balance: noviBalans,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Obriši trošak
      // Obriši trošak
      const { error: deleteError } = await supabase
        .from("troskovi")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Ponovo učitaj sve iz baze
      await izracunajAnalitiku();
    } catch (err) {
      console.log(err);
      Alert.alert("Greška", "Brisanje troška nije uspelo.");
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
                  {procenatPotrosenoLimit.toFixed(1)}%
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
                Sve ukupno limit:
              </Text>
            </View>
            <Text style={[styles.statValue, { color: "#3b82f6" }]}>
              {mesecniLimit.toFixed(2)} €
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

        <Text
          style={[
            styles.title,
            {
              color: theme.text,
              fontSize: 22,
              marginTop: 20,
            },
          ]}
        >
          Svi troškovi
        </Text>

        {troskovi.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() =>
              setExpandedId(expandedId === item.id ? null : item.id)
            }
            style={{
              backgroundColor: theme.card || "#1e293b",
              padding: 15,
              borderRadius: 15,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontWeight: "600",
                }}
              >
                {item.naslov}
              </Text>

              <Text
                style={{
                  color: "#ef4444",
                  fontWeight: "700",
                }}
              >
                -{Number(item.iznos).toFixed(2)} €
              </Text>
            </View>

            {expandedId === item.id && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: theme.text }}>
                  Kategorija: {item.kategorija}
                </Text>

                <Text
                  style={{
                    color: theme.text,
                    marginTop: 5,
                  }}
                >
                  Opis: {item.beljeska || "Nema opisa"}
                </Text>

                <TouchableOpacity
                  onPress={() => obrisiTrosak(item.id)}
                  style={{
                    backgroundColor: "#ef4444",
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    Obriši trošak
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
