"use client";

import { createContext, useContext, useEffect, useState } from "react";
import t, { Lang } from "@/lib/translations";

type Translations = typeof t["en"];

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  T: Translations;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  T: t.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("agentforge-lang") as Lang | null;
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("agentforge-lang", l);
  }

  function toggleLang() {
    setLang(lang === "en" ? "hi" : "en");
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, T: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
