import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progressText: string;
}

export default function AchievementsScreen() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [listaNagrada, setListaNagrada] = useState<Achievement[]>([]);

  useEffect(() => {
    izracunajPostignuca();
  }, []);

  const izracunajPostignuca = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Povuci balans direktno iz tabele Korisnici za ulogovanog korisnika
      const { data: korisnikPodaci, error: korisnikError } = await supabase
        .from("Korisnici")
        .select("current_balance")
        .eq("id", user.id)
        .single();

      // 2. Povuci planove budžeta (za sertifikovanog planera)
      const { data: planovi, error: planoviError } = await supabase
        .from("budzeti")
        .select("id")
        .eq("user_id", user.id);

      // 3. Povuci troškove u ovom mesecu (za ekstremnog štedišu)
      const pocetakMeseca = new Date();
      pocetakMeseca.setDate(1);
      pocetakMeseca.setHours(0, 0, 0, 0);

      const { data: troskoviMesec, error: troskoviError } = await supabase
        .from("troskovi")
        .select("iznos")
        .eq("user_id", user.id)
        .gte("datum", pocetakMeseca.toISOString());

      if (korisnikError || planoviError || troskoviError) {
        console.log("Supabase error detalji:", {
          korisnikError,
          planoviError,
          troskoviError,
        });
      }

      // Dinamičko uzimanje vrednosti iz baze uz bezbedan fallback na 0
      const trenutniBalans = korisnikPodaci?.current_balance
        ? parseFloat(korisnikPodaci.current_balance)
        : 0;
      const imaPlan = (planovi && planovi.length > 0) || false;

      const ukupnoPotrosenoUMesecu = (troskoviMesec || []).reduce(
        (acc, curr) => acc + Math.abs(parseFloat(curr.iznos || 0)),
        0,
      );

      const postignuca: Achievement[] = [
        {
          id: "finansijski_milioner",
          title: "Finansijski Milioner 💰",
          description: "Ostvari ukupan balans veći od 1,000,000 €.",
          icon: "cash-multiple",
          isUnlocked: trenutniBalans >= 1000000,
          progressText: `TRENUTNO: ${trenutniBalans.toLocaleString()} €`,
        },
        {
          id: "multimilioner",
          title: "Multimilioner 👑",
          description: "Ostvari ukupan balans veći od 2,000,000 €.",
          icon: "crown",
          isUnlocked: trenutniBalans >= 2000000,
          progressText: `TRENUTNO: ${trenutniBalans.toLocaleString()} €`,
        },
        {
          id: "prvi_plan",
          title: "Sertifikovani Planer 🎯",
          description: "Kreiraj svoj prvi plan za budžetiranje.",
          icon: "notebook-check",
          isUnlocked: imaPlan,
          progressText: imaPlan ? "ZAVRŠENO!" : "Nema kreiranih planova",
        },
        {
          id: "skroman_mesec",
          title: "Ekstremni Štediša 🛡️",
          description: "Potroši manje od 50 € u roku od mesec dana.",
          icon: "piggy-bank",
          isUnlocked:
            ukupnoPotrosenoUMesecu > 0 && ukupnoPotrosenoUMesecu <= 50,
          progressText: `POTROŠENO OVOG MESECA: ${ukupnoPotrosenoUMesecu.toFixed(2)} €`,
        },
      ];

      setListaNagrada(postignuca);
    } catch (error: any) {
      console.log("Greška u try-catch bloku postignuća:", error.message);
      Alert.alert("Greška", "Nije uspelo učitavanje postignuća.");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.title, { color: theme.text }]}>
        Tvoja Postignuća 🏆
      </Text>
      <Text style={[styles.subtitle, { color: theme.subText || "#64748b" }]}>
        Prati svoj finansijski napredak i otključaj značke.
      </Text>
    </View>
  );

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
        <FlatList
          data={listaNagrada}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={izracunajPostignuca}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                  borderColor: theme.border || "#e2e8f0",
                  opacity: item.isUnlocked ? 1 : 0.6,
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={32}
                    color={item.isUnlocked ? theme.accent : "#94a3b8"}
                  />
                  {!item.isUnlocked && (
                    <View style={styles.lockOverlay}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={14}
                        color="#64748b"
                      />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.cardDescription,
                    { color: theme.subText || "#64748b" },
                  ]}
                >
                  {item.description}
                </Text>
                <Text
                  style={[
                    styles.progressText,
                    { color: item.isUnlocked ? "#3b82f6" : "#94a3b8" },
                  ]}
                >
                  {item.progressText}
                </Text>
              </View>
            </View>
          )}
        />
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: Platform.OS === "ios" ? 0 : 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  lockOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
