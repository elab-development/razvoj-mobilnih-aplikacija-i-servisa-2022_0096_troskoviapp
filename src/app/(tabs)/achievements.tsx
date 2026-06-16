import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useTheme } from "../../ThemeContext"; // Prilagodi putanju ako je potrebno
import { supabase } from "../supabaseClient"; // Prilagodi putanju

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progressText?: string;
}

export default function AchievementsScreen() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    izracunajPostignuca();
  }, []);

  const izracunajPostignuca = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Povuci balans korisnika (prilagodi ime tabele i kolone ako se zovu drugačije, npr. 'profili' ili 'korisnici')
      // Pretpostavljamo da imaš tabelu 'profiles' gde čuvaš trenutni balans
      const { data: profil } = await supabase
        .from("profiles")
        .select("current_balance")
        .eq("id", user.id)
        .single();

      const trenutniBalans = profil?.current_balance || 0;

      // 2. Povuci planove budžeta da vidimo da li je napravio bar jedan
      const { data: planovi } = await supabase
        .from("budzeti")
        .select("id")
        .eq("user_id", user.id);

      const imaPlan = planovi && planovi.length > 0;

      // 3. Povuci troškove u poslednjih 30 dana za nagradu "Štediša"
      const mesecDanaOdPre = new Date();
      mesecDanaOdPre.setDate(mesecDanaOdPre.getDate() - 30);

      const { data: troskovi } = await supabase
        .from("troskovi")
        .select("iznos")
        .eq("user_id", user.id)
        .gte("datum", mesecDanaOdPre.toISOString());

      const ukupnoPotrosenoUMesecu = (troskovi || []).reduce(
        (acc, curr) => acc + (curr.iznos || 0),
        0,
      );

      // Korisnik je štediša ako ima troškove, ali su manji od 50€
      const jeStedisa =
        troskovi && troskovi.length > 0 && ukupnoPotrosenoUMesecu < 50;

      // 4. Definišemo niz nagrada sa dinamičkim statusom otključanosti
      const listaNagrada: Achievement[] = [
        {
          id: "milioner",
          title: "Finansijski Milioner 💰",
          description: "Ostvari ukupan balans veći od 1,000,000 €.",
          icon: "cash-multiple",
          isUnlocked: trenutniBalans >= 1000000,
          progressText: `Trenutno: ${trenutniBalans.toLocaleString()} €`,
        },
        {
          id: "multimilioner",
          title: "Multimilioner 👑",
          description: "Ostvari ukupan balans veći od 2,000,000 €.",
          icon: "crown",
          isUnlocked: trenutniBalans >= 2000000,
          progressText: `Trenutno: ${trenutniBalans.toLocaleString()} €`,
        },
        {
          id: "prvi_plan",
          title: "Sertifikovani Planer 🎯",
          description: "Kreiraj svoj prvi plan za budžetiranje.",
          icon: "notebook-check",
          isUnlocked: !!imaPlan,
          progressText: imaPlan ? "Završeno!" : "Nema kreiranih planova",
        },
        {
          id: "skroman_mesec",
          title: "Ekstremni Štediša 🛡️",
          description: "Potroši manje od 50 € u roku od mesec dana.",
          icon: "piggy-bank",
          isUnlocked: !!jeStedisa,
          progressText: `Potrošeno ovog meseca: ${ukupnoPotrosenoUMesecu.toFixed(2)} €`,
        },
      ];

      setAchievements(listaNagrada);
    } catch (error) {
      console.error("Greška pri računanju postignuća:", error);
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const lockedOpacity = isDarkMode ? 0.35 : 0.5;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>
        Tvoja Postignuća 🏆
      </Text>
      <Text
        style={[styles.headerSubtitle, { color: theme.subText || "#64748b" }]}
      >
        Prati svoj finansijski napredak i otključaj značke.
      </Text>

      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={izracunajPostignuca}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: theme.border || "#e2e8f0",
                opacity: item.isUnlocked ? 1 : lockedOpacity,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={40}
                color={item.isUnlocked ? theme.accent : "#94a3b8"}
              />
              {!item.isUnlocked && (
                <View style={styles.lockOverlay}>
                  <MaterialCommunityIcons name="lock" size={16} color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.text,
                    textDecorationLine: item.isUnlocked ? "none" : "none",
                  },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.description,
                  { color: theme.subText || "#64748b" },
                ]}
              >
                {item.description}
              </Text>
              {item.progressText && (
                <Text style={[styles.progress, { color: theme.accent }]}>
                  {item.progressText}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    position: "relative",
    marginRight: 16,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  lockOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#64748b",
    borderRadius: 10,
    padding: 2,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  progress: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
