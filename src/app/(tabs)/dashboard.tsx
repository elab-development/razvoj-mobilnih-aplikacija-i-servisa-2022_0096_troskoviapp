import { Feather } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

// 1. Mapiranje mapa ikonica i labela za kategorije kako bi prikaz na Dashboard-u bio prepoznatljiv
const KATEGORIJE_MAPA: { [key: string]: { label: string; znak: string } } = {
  Food: { label: "Hrana", znak: "🍔" },
  Transport: { label: "Prevoz", znak: "🚗" },
  Rent: { label: "Stanarina", znak: "🏠" },
  Social: { label: "Izlasci", znak: "🍷" },
  Uni: { label: "Faks", znak: "🎓" },
  Other: { label: "Ostalo", znak: "💼" },
};

// 2. Interfejs prilagođen stvarnoj strukturi tabele "troskovi" (id je UUID - string)
interface Trosak {
  id: string;
  user_id: string;
  naslov: string;
  iznos: number;
  kategorija: string;
  beljeska?: string | null;
  created_at: string;
}

export default function DashboardScreen() {
  const { theme } = useTheme();

  const [troskovi, setTroskovi] = useState<Trosak[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Povuci podatke prilikom učitavanja ekrana
  useEffect(() => {
    fetchTroskovi();
  }, []);

  const fetchTroskovi = async () => {
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

      // Gađamo tabelu "troskovi" i sortiramo po vremenu kreiranja
      const { data, error } = await supabase
        .from("troskovi")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTroskovi(data || []);
    } catch (error: any) {
      console.error("Greška pri povlačenju:", error);
      if (Platform.OS === "web") {
        alert("Nije uspelo osvežavanje troškova: " + error.message);
      } else {
        Alert.alert(
          "Greška",
          "Nije uspelo osvežavanje troškova: " + error.message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/(auth)/login" as Href);
    } catch (error: any) {
      if (Platform.OS === "web") alert("Nije uspela odjava: " + error.message);
      else Alert.alert("Greška", "Nije uspela odjava: " + error.message);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Funkcija za brisanje troška prilagođena i za Web i za Mobile platforme
  const handleDeleteExpense = (
    id: string,
    iznosTroska: number,
    userId: string,
  ) => {
    console.log("Dugme kliknuto za ID:", id);

    const izvrsiBrisanje = async () => {
      try {
        setLoading(true);

        // Brisanje reda iz tabele troskovi
        const { error } = await supabase.from("troskovi").delete().eq("id", id);

        if (error) throw error;

        // Odmah izbacujemo obrisani trošak iz stanja bez novog fetch-ovanja
        setTroskovi((prev) => prev.filter((t) => t.id !== id));

        if (Platform.OS === "web") {
          alert("Trošak je uspešno obrisan.");
        } else {
          setTimeout(() => {
            Alert.alert("Uspeh", "Trošak je uspešno obrisan.");
          }, 100);
        }
      } catch (error: any) {
        if (Platform.OS === "web") {
          alert("Brisanje nije uspelo: " + error.message);
        } else {
          setTimeout(() => {
            Alert.alert("Greška", "Brisanje nije uspelo: " + error.message);
          }, 100);
        }
      } finally {
        setLoading(false);
      }
    };

    // Ako smo na vebu, koristi standardni window.confirm jer Alert.alert tu ne radi
    if (Platform.OS === "web") {
      const potvrda = window.confirm(
        "Da li ste sigurni da želite da obrišete ovaj trošak?",
      );
      if (potvrda) {
        izvrsiBrisanje();
      }
    } else {
      // Ako smo na iOS/Android uređaju, podigni sistemski Alert dijalog
      Alert.alert(
        "Potvrda brisanja",
        "Da li ste sigurni da želite da obrišete ovaj trošak?",
        [
          { text: "Otkaži", style: "cancel" },
          { text: "Obriši", style: "destructive", onPress: izvrsiBrisanje },
        ],
        { cancelable: true },
      );
    }
  };

  const renderItem = ({ item }: { item: Trosak }) => {
    const isExpanded = expandedId === item.id;

    const katInfo = KATEGORIJE_MAPA[item.kategorija] || {
      label: item.kategorija,
      znak: "💰",
    };

    const pročišćenDatum = item.created_at
      ? new Date(item.created_at).toLocaleDateString("sr-RS")
      : "Nema datuma";

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card || "rgba(0,0,0,0.02)",
            borderColor: theme.border || "#e2e8f0",
          },
        ]}
      >
        {/* Glavni red - uvek vidljiv */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>
              {katInfo.znak} {item.naslov}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.itemAmount}>-{item.iznos.toFixed(2)} €</Text>
            <Text style={[styles.arrow, { color: theme.subText }]}>
              {isExpanded ? "▲" : "▼"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Prošireni detalji troška */}
        {isExpanded && (
          <View
            style={[
              styles.cardDetails,
              { borderTopColor: theme.border || "#e2e8f0" },
            ]}
          >
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.subText }]}>
                Kategorija:
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {katInfo.label}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.subText }]}>
                Datum:
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {pročišćenDatum}
              </Text>
            </View>
            {item.beljeska ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.subText }]}>
                  Beleška:
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {item.beljeska}
                </Text>
              </View>
            ) : null}

            {/* DUGME ZA BRISANJE TROŠKA */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                handleDeleteExpense(item.id, item.iznos, item.user_id)
              }
            >
              <Feather
                name="trash-2"
                size={16}
                color="#ef4444"
                style={styles.deleteIcon}
              />
              <Text style={styles.deleteButtonText}>Obriši trošak</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top sekcija */}
      <View style={styles.topSection}>
        <Text style={[styles.title, { color: theme.text }]}>Vaš Budžet 📊</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Pregled skorašnjih troškova i aktivnosti
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/(tabs)/expenses" as Href)}
        >
          <Text style={styles.navButtonText}>+ Unesi novi trošak</Text>
        </TouchableOpacity>
      </View>

      {/* Lista transakcija */}
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Poslednje transakcije
          </Text>
          <TouchableOpacity onPress={fetchTroskovi}>
            <Text style={{ color: theme.accent, fontWeight: "600" }}>
              Osveži ↻
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <FlatList
            data={troskovi}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                Nema unetih troškova u bazi.
              </Text>
            }
          />
        )}
      </View>

      {/* Footer odjava */}
      <View style={styles.footerSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Odjavi se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  topSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: "#6200ee",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
    marginRight: 10,
  },
  arrow: {
    fontSize: 11,
    width: 15,
    textAlign: "center",
  },
  cardDetails: {
    borderTopWidth: 1,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    width: 90,
    fontSize: 13,
    fontWeight: "600",
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
  footerSection: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 10,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  deleteIcon: {
    marginRight: 6,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
});
