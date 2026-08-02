"use client";

import { useLanguage } from "../i18n/LanguageContext";

const OTHER = { en: { code: "fr", flag: "🇫🇷", label: "FR" }, fr: { code: "en", flag: "🇬🇧", label: "EN" } } as const;

/**
 * variant="compact" — desktop navbar pill (hidden on mobile).
 * variant="full"    — mobile drawer row.
 */
export default function LanguageSwitcher({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { lang, setLang } = useLanguage();
  const next = OTHER[lang];

  /* ── Full (mobile drawer) ──────────────────────────────────────── */
  if (variant === "full") {
    return (
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Language</span>
        </div>

        {/* Segmented pill */}
        <div role="group" aria-label="Language selector" className="flex items-center rounded-full bg-gray-100 p-0.5 gap-px">
          {(["en", "fr"] as const).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={[
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 select-none",
                lang === code
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-400 hover:text-gray-600",
              ].join(" ")}
            >
              <span className="text-sm leading-none">{code === "en" ? "🇬🇧" : "🇫🇷"}</span>
              <span>{code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Compact (desktop nav only — hidden on mobile) ─────────────── */
  return (
    <button
      onClick={() => setLang(next.code)}
      aria-label={`Switch to ${next.label}`}
      title={`Switch to ${next.label}`}
      className={[
        "hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "text-[11px] font-semibold tracking-wide text-gray-500",
        "border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700",
        "shadow-sm transition-all duration-150 active:scale-95 select-none",
      ].join(" ")}
    >
      <span className="text-sm leading-none">{next.flag}</span>
      <span>{next.label}</span>
    </button>
  );
}
