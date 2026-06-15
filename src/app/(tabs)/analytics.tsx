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
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [ukupnoPotroseno, setUkupnoPotroseno] = useState<number>(0);
  const [preostaliBudzet, setPreostaliBudzet] = useState<number>(0);
  const [procenatPotroseno, setProcenatPotroseno] = useState<number>(0);

  const PODRAZUMEVANI_BUDZET = 500;

  // Podešavanja za SVG kružni grafikon
  const size = 200;
  const strokeWidth = 18;
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
        (acc, curr) => acc + (curr.iznos || 0),
        0,
      );

      const ukupanPocetniBudzet = trenutniPreostaliBudzet + sumaTroskova;

      const izracunatProcenat =
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
      setProcenatPotroseno(izracunatProcenat);
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

  // Izračunavanje dokle se iscrtava crveni prsten potrošnje
  const strokeDashoffset =
    circumference - (procenatPotroseno / 100) * circumference;

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
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.background || "#111c24" },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text || "#fff" }]}>
          Analitika Troškova 📊
        </Text>
        <Text style={[styles.subtitle, { color: theme.subText || "#94a3b8" }]}>
          Pregled stanja prilagođen tvom uređaju
        </Text>
      </View>

      {/* MOBILNI DIZAJN: Kružni grafikon sa tekstom u centru */}
      <View style={styles.chartContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Pozadinski krug - Preostali budžet (Zelena staza) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Prednji krug - Potrošeni budžet (Crveni napredak) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} // Rotacija da krene od vrha
          />
        </Svg>

        {/* Centrirani tekst unutar kruga */}
        <View style={styles.absoluteCenter}>
          <Text style={[styles.procenatText, { color: theme.text || "#fff" }]}>
            {procenatPotroseno}%
          </Text>
          <Text
            style={[
              styles.procenatLabel,
              { color: theme.subText || "#94a3b8" },
            ]}
          >
            potrošeno
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
            <View style={[styles.indicator, { backgroundColor: "#ef4444" }]} />
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
            <View style={[styles.indicator, { backgroundColor: "#10b981" }]} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginVertical: 20,
  },
  svg: {
    transform: [{ scaleX: 1 }], // Osigurava stabilnost prikaza na oba OS-a
  },
  absoluteCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  procenatText: {
    fontSize: 38,
    fontWeight: "800",
  },
  procenatLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsSection: {
    marginTop: 40,
    marginBottom: 40,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  statLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
