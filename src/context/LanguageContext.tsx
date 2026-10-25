// src/context/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Language, TranslationDictionary, translations, getTranslation } from "@/lib/i18n";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary) => string;
}

const defaultContextValue: LanguageContextValue = {
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: keyof TranslationDictionary) => getTranslation(key, "en"),
};

const LanguageContext = createContext<LanguageContextValue>(defaultContextValue);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Read saved preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("v2v_lang");
      if (saved === "hi" || saved === "en") {
        setLanguageState(saved);
      }
    } catch {
      // localStorage may be disabled or SSR
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("v2v_lang", lang);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === "en" ? "hi" : "en";
    setLanguage(nextLang);
  };

  const t = useMemo(() => {
    return (key: keyof TranslationDictionary) => getTranslation(key, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
}

export default LanguageContext;
