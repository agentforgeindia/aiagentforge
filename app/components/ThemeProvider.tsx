"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

type ThemeContextType = {
  darkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agentforge-theme");
    const shouldUseDark = saved === "dark";

    setDarkModeState(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("agentforge-theme", value ? "dark" : "light");
      if (value) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    return {
      darkMode: false,
      toggleTheme: () => {},
      setDarkMode: () => {},
    };
  }

  return context;
}
