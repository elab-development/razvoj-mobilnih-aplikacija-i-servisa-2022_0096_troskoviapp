import { StyleSheet, Text, View } from "react-native";

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pregled Troškova</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111c24", // Tamna pozadina sa dizajna
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
