"use client";

import { useLanguage } from "../i18n/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "fr" : "en")}
      title={lang === "en" ? "Switch to French / Passer en Français" : "Switch to English / Passer en Anglais"}
      aria-label={lang === "en" ? "Switch to French" : "Switch to English"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm select-none"
    >
      <span className="text-base leading-none">{lang === "en" ? "🇫🇷" : "🇬🇧"}</span>
      <span>{lang === "en" ? "FR" : "EN"}</span>
    </button>
  );
}
