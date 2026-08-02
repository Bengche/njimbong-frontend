"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  translations,
  type Language,
  type TranslationDict,
} from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: <K extends keyof TranslationDict>(section: K) => TranslationDict[K];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (section) => translations.en[section],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("njimbong_lang") as Language | null;
      if (saved === "fr" || saved === "en") setLangState(saved);
    } catch {
      // localStorage not available (SSR or private mode)
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("njimbong_lang", newLang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    <K extends keyof TranslationDict>(section: K): TranslationDict[K] => {
      return translations[lang][section] as TranslationDict[K];
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
