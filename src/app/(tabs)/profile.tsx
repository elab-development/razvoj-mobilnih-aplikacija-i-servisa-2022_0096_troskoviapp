import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Uvozimo ImagePicker
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image, // Uvozimo Image za prikaz prave slike
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../supabaseClient";

export default function ProfileScreen() {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // Stanje za otpremanje slike
  const [isEditing, setIsEditing] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Stanje za URL slike

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser)
        throw authError || new Error("Korisnik nije pronađen.");

      setUserId(authUser.id);
      setEmail(authUser.email || "");

      // Dodali smo 'avatar_url' u select
      const { data, error: dbError } = await supabase
        .from("Korisnici")
        .select("first_name, last_name, phone, current_balance, avatar_url")
        .eq("id", authUser.id)
        .single();

      if (dbError) throw dbError;

      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
        setCurrentBalance(
          data.current_balance ? data.current_balance.toString() : "0",
        );
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error: any) {
      console.log("Greška na profilu:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Meni za izbor: Kamera ili Galerija
  const showImageOptions = () => {
    Alert.alert(
      "Promeni profilnu sliku",
      "Izaberite opciju:",
      [
        {
          text: "Napravi selfi",
          onPress: () => handlePickImage(true),
        },
        {
          text: "Izaberi iz galerije",
          onPress: () => handlePickImage(false),
        },
        {
          text: "Otkaži",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  // Funkcija za biranje slike (bilo kamera ili galerija)
  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result;

      if (useCamera) {
        // Traženje dozvole za kameru
        const cameraPermission =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert(
            "Dozvola odbijena",
            "Morate dozvoliti pristup kameri da biste se uslikali.",
          );
          return;
        }
        // Pokretanje kamere
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Kvadratna slika za avatar
          quality: 0.5, // Smanjen kvalitet radi bržeg uploada
        });
      } else {
        // Traženje dozvole za pristup galeriji
        const galleryPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!galleryPermission.granted) {
          Alert.alert(
            "Dozvola odbijena",
            "Morate dozvoliti pristup galeriji da biste izabrali sliku.",
          );
          return;
        }
        // Otvaranje galerije
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const pickedImage = result.assets[0];
      await uploadAvatar(pickedImage.uri);
    } catch (error: any) {
      Alert.alert("Greška", "Akcija nije uspela: " + error.message);
    }
  };

  // Funkcija koja šalje sliku na Supabase Storage
  const uploadAvatar = async (fileUri: string) => {
    if (!userId) return;

    try {
      setUploading(true);

      // Konvertujemo uri u format koji Supabase prihvata na mobilnim uređajima
      const formData = new FormData();
      const fileExt = fileUri.split(".").pop();
      // Pravimo jedinstveno ime fajla koristeći userId i timestamp
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      // 1. Upload fajla u 'avatars' bucket (upsert: true zamenjuje ako postoji)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, formData, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Uzimanje javnog URL-a za tu sliku
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // 3. Ažuriranje 'avatar_url' u tabeli Korisnici
      const { error: updateError } = await supabase
        .from("Korisnici")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Postavljanje novog URL-a u lokalni state da se odmah osveži na ekranu
      setAvatarUrl(publicUrl);
      Alert.alert("Uspeh", "Profilna slika je promenjena!");
    } catch (error: any) {
      Alert.alert("Greška pri otpremanju", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Greška", "Ime i prezime moraju biti popunjeni.");
      return;
    }

    const balanceNum = parseFloat(currentBalance);
    if (isNaN(balanceNum)) {
      Alert.alert("Greška", "Budžet mora biti ispravan broj.");
      return;
    }

    if (newPassword.trim() && newPassword.length < 6) {
      Alert.alert("Greška", "Nova lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    try {
      setSaving(true);

      if (newPassword.trim()) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (authUpdateError) throw authUpdateError;
      }

      const { error: dbUpdateError } = await supabase
        .from("Korisnici")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          current_balance: balanceNum,
        })
        .eq("id", userId);

      if (dbUpdateError) throw dbUpdateError;

      Alert.alert("Uspeh", "Podaci su uspešno ažurirani!");
      setNewPassword("");
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Greška", "Čuvanje nije uspelo: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/(auth)/login" as Href);
    } catch (error: any) {
      Alert.alert("Greška", "Nije uspela odjava: " + error.message);
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSpacer} />

        <View style={styles.contentContainer}>
          {/* Gornji deo - Avatar i Ime/Prezime */}
          <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
            {/* KLIKOM NA AVATAR POKREĆE SE IZMENA */}
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={showImageOptions} // Sada pozivamo meni sa opcijama
              disabled={uploading}
            >
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: isDarkMode ? "#334155" : "#eff6ff" },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Feather name="user" size={40} color={theme.accent} />
                )}
              </View>

              {/* Mala ikonica kamere u uglu avatara */}
              <View
                style={[styles.cameraBadge, { backgroundColor: theme.accent }]}
              >
                <Feather name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.nameText, { color: theme.text }]}>
              {`${firstName} ${lastName}`.trim() || "Korisnik"}
            </Text>
            <Text style={[styles.emailText, { color: theme.subText }]}>
              {email || "Nema emaila"}
            </Text>
          </View>

          {/* Srednji deo - Podaci o nalogu */}
          <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Podaci o nalogu
              </Text>

              {isEditing ? (
                <TouchableOpacity
                  style={[styles.editModeButton, styles.saveButton]}
                  onPress={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Sačuvaj</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.editModeButton,
                    { backgroundColor: isDarkMode ? "#334155" : "#eff6ff" },
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Izmeni</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* IME */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <Feather
                  name="user"
                  size={20}
                  color={theme.subText}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Ime
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.inputStyle,
                    { color: theme.text, borderBottomColor: theme.accent },
                  ]}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              ) : (
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  {firstName || "/"}
                </Text>
              )}
            </View>

            {/* PREZIME */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <Feather
                  name="user"
                  size={20}
                  color={theme.subText}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Prezime
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.inputStyle,
                    { color: theme.text, borderBottomColor: theme.accent },
                  ]}
                  value={lastName}
                  onChangeText={setLastName}
                />
              ) : (
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  {lastName || "/"}
                </Text>
              )}
            </View>

            {/* BROJ TELEFONA */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <Feather
                  name="phone"
                  size={20}
                  color={theme.subText}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Broj telefona
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.inputStyle,
                    { color: theme.text, borderBottomColor: theme.accent },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  {phone || "/"}
                </Text>
              )}
            </View>

            {/* POČETNI BUDŽET */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <Feather
                  name="credit-card"
                  size={20}
                  color={theme.subText}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Početni budžet
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.inputStyle,
                    { color: theme.text, borderBottomColor: theme.accent },
                  ]}
                  value={currentBalance}
                  onChangeText={setCurrentBalance}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  {currentBalance} EUR
                </Text>
              )}
            </View>

            {/* NOVA LOZINKA */}
            {isEditing && (
              <View
                style={[styles.infoRow, { borderBottomColor: theme.border }]}
              >
                <View style={styles.rowLeft}>
                  <Feather
                    name="lock"
                    size={20}
                    color={theme.subText}
                    style={styles.rowIcon}
                  />
                  <Text style={[styles.rowLabel, { color: theme.subText }]}>
                    Nova lozinka
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.inputStyle,
                    { color: theme.text, borderBottomColor: theme.accent },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Ostavi prazno ako ne menjaš"
                  placeholderTextColor={theme.subText}
                />
              </View>
            )}

            {/* STATUS NALOGA */}
            <View
              style={[
                styles.infoSectionChild,
                styles.infoRow,
                { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.rowLeft}>
                <Feather
                  name="shield"
                  size={20}
                  color={theme.subText}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: theme.subText }]}>
                  Status Naloga
                </Text>
              </View>
              <Text
                style={{ color: "#10b981", fontWeight: "600", fontSize: 15 }}
              >
                Aktivan
              </Text>
            </View>
          </View>

          {/* ODELJAK: PODEŠAVANJA */}
          {!isEditing && (
            <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, marginBottom: 12 },
                ]}
              >
                Podešavanja
              </Text>
              <View style={styles.switchRow}>
                <View style={styles.rowLeft}>
                  <Feather
                    name={isDarkMode ? "moon" : "sun"}
                    size={20}
                    color={theme.subText}
                    style={styles.rowIcon}
                  />
                  <Text style={[styles.rowLabel, { color: theme.text }]}>
                    Mračni režim (Dark mode)
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
                  thumbColor={isDarkMode ? "#ffffff" : "#f4f3f4"}
                  onValueChange={toggleTheme}
                  value={isDarkMode}
                />
              </View>
            </View>
          )}

          {/* Otkaži dugme */}
          {isEditing && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" },
              ]}
              onPress={() => {
                setIsEditing(false);
                setNewPassword("");
                getProfile();
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.subText }]}>
                Otkaži
              </Text>
            </TouchableOpacity>
          )}

          {/* Odjava dugme */}
          {!isEditing && (
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: theme.card,
                  borderColor: isDarkMode ? "#451a1a" : "#fee2e2",
                },
              ]}
              onPress={handleLogout}
            >
              <Feather
                name="log-out"
                size={20}
                color="#ef4444"
                style={styles.buttonIcon}
              />
              <Text style={styles.logoutText}>Odjavi se</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topSpacer: {
    flex: 0.4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Da slika ne izlazi iz krugova
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  infoSection: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  infoSectionChild: {
    paddingVertical: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingLeft: 4,
  },
  editModeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#3b82f6",
    fontSize: 13,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#10b981",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
    width: 20,
  },
  rowLabel: {
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  inputStyle: {
    fontSize: 14,
    fontWeight: "500",
    borderBottomWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: "right",
    minWidth: 160,
  },
  cancelButton: {
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    borderWidth: 1,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
