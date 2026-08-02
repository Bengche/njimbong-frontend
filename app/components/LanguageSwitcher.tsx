"use client";

import { useLanguage } from "../i18n/LanguageContext";

const LANGS = [
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
] as const;

/**
 * Compact sliding-pill language toggle.
 * variant="full" renders a wider labelled version for the mobile drawer.
 */
export default function LanguageSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "full";
}) {
  const { lang, setLang } = useLanguage();
  const activeIdx = LANGS.findIndex((l) => l.code === lang);

  if (variant === "full") {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left label */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-base">
            🌐
          </span>
          <span className="text-sm font-semibold text-gray-700">Language</span>
        </div>

        {/* Pill toggle */}
        <div
          role="group"
          aria-label="Language selector"
          className="relative flex items-center p-0.5 rounded-full bg-gray-100 border border-gray-200/80"
          style={{ isolation: "isolate" }}
        >
          {/* Sliding indicator */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-white shadow border border-gray-200/60 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              width: "calc(50% - 2px)",
              left: activeIdx === 0 ? "2px" : "calc(50%)",
            }}
          />
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors duration-200 select-none ${
                lang === l.code ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-sm leading-none">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Compact (desktop nav) ─────────────────────────────────────── */
  return (
    <div
      role="group"
      aria-label="Language selector"
      className="relative flex items-center p-0.5 rounded-full bg-gray-100/90 border border-gray-200/70 shadow-sm"
      style={{ isolation: "isolate" }}
    >
      {/* Globe icon */}
      <span
        aria-hidden="true"
        className="flex-shrink-0 ml-1.5 mr-0.5 text-[13px] text-gray-400 select-none pointer-events-none"
      >
        🌐
      </span>

      {/* Sliding white pill */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-white shadow-sm border border-gray-200/60 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: "calc(50% - 14px)",
          left:
            activeIdx === 0
              ? "calc(14px + 2px)"
              : "calc(50% + 2px)",
        }}
      />

      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`relative z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 select-none ${
            lang === l.code ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <span className="text-xs leading-none">{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
