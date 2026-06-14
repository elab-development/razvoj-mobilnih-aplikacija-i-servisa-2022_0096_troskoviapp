import React, { createContext, useContext, useState } from "react";

// Definišemo boje za Light i Dark mod
export const lightTheme = {
  background: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  subText: "#64748b",
  border: "#f1f5f9",
  accent: "#3b82f6",
  inputBg: "#ffffff",
  tabBar: "#0f172a", // tamna boja za tab bar kao na tvojoj slici
};

export const darkTheme = {
  background: "#0f172a",
  card: "#1e293b",
  text: "#f8fafc",
  subText: "#94a3b8",
  border: "#334155",
  accent: "#3b82f6",
  inputBg: "#1e293b",
  tabBar: "#1e293b",
};

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
