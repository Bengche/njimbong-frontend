"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface ListingResult {
  id: number;
  title: string;
  price: number;
  currency: string;
  city?: string;
  location?: string;
  condition?: string;
  category?: string;
  image_url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  listings?: ListingResult[];
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

export default function NjimbongChat() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const ai = t("aiChat");

  const WELCOME_MESSAGE: Message = {
    id: "welcome",
    role: "assistant",
    content: ai.welcome,
  };

  const getPageSuggestions = (path: string): readonly string[] => {
    if (path?.includes("/dashboard")) return ai.suggestions.dashboard;
    if (path?.includes("/listing")) return ai.suggestions.listing;
    if (path?.includes("/profile")) return ai.suggestions.profile;
    if (path?.includes("/chat")) return ai.suggestions.chat;
    if (path?.includes("/sell")) return ai.suggestions.sell;
    return ai.suggestions.default;
  };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hide on admin / auth pages
  const hidden =
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, scrollToBottom]);

  const buildPageContext = useCallback(() => {
    const page = pathname || "";
    if (page.includes("/listing/"))
      return "User is viewing a product listing page.";
    if (page.includes("/profile")) return "User is on a profile page.";
    if (page.includes("/chat")) return "User is in the messaging/chat section.";
    if (page.includes("/dashboard"))
      return "User is on the main marketplace dashboard browsing listings.";
    if (page.includes("/favorites"))
      return "User is viewing their favorite saved items.";
    if (page.includes("/orders")) return "User is viewing their orders.";
    if (page.includes("/safety"))
      return "User is on the safety and trust page.";
    return "User is browsing the Njimbong Marketplace.";
  }, [pathname]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      setError(null);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };

      // Build history from existing messages (exclude welcome + streaming placeholders)
      const historyForAPI = messages
        .filter((m) => m.id !== "welcome" && !m.streaming)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);

      // Create streaming placeholder
      const streamId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: streamId, role: "assistant", content: "", streaming: true },
      ]);

      abortRef.current = new AbortController();

      try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: text.trim(),
            history: historyForAPI,
            pageContext: buildPageContext(),
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const statusMsg =
            response.status === 503
              ? errData.error || "Njimbong AI is not available right now."
              : response.status === 429
                ? "Too many requests — please wait a moment and try again."
                : errData.error || "Njimbong AI is temporarily unavailable.";
          throw new Error(statusMsg);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.listings) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamId ? { ...m, listings: parsed.listings } : m,
                  ),
                );
              }
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamId
                      ? { ...m, content: m.content + parsed.text }
                      : m,
                  ),
                );
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch {}
          }
        }

        // Mark streaming done
        setMessages((prev) =>
          prev.map((m) => (m.id === streamId ? { ...m, streaming: false } : m)),
        );
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("NjimbongChat error:", err);
        setError(
          err.message ||
            "Njimbong AI is temporarily unavailable. Please try again.",
        );
        setMessages((prev) => prev.filter((m) => m.id !== streamId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        scrollToBottom();
      }
    },
    [isStreaming, messages, scrollToBottom, buildPageContext],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    inputRef.current?.focus();
  };

  const suggestions = getPageSuggestions(pathname || "");

  if (hidden) return null;

  return (
    <>
      {/* ── Trigger: vertical edge tab pinned to right side ─────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={ai.openTitle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-[70]
            flex flex-col items-center justify-center gap-2
            w-8 py-5 rounded-l-2xl
            border border-r-0 border-slate-600/30
            shadow-[-4px_0_20px_rgba(0,0,0,0.25)]
            transition-all duration-300
            ${
              isOpen
                ? "bg-slate-700 w-9"
                : "bg-gradient-to-b from-slate-800 to-slate-900 hover:w-10"
            }`}
      >
        <svg
          className="w-3.5 h-3.5 text-white flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        <span className="text-white/80 text-[9px] font-bold tracking-[0.2em] [writing-mode:vertical-rl] rotate-180 select-none">
          AI
        </span>
      </button>
      {/* ── Chat Panel: right side-sheet on desktop, full screen on mobile ─────── */}
      <div
        className={`fixed z-[70] transition-all duration-300 ease-in-out
          inset-0 md:inset-auto md:top-[6.5rem] md:right-0 md:bottom-0 md:w-[360px]
          ${
            isOpen
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "translate-x-full opacity-0 pointer-events-none"
          }`}
        style={isOpen ? { boxShadow: "-8px 0 40px rgba(0,0,0,0.18)" } : {}}
      >
        <div className="flex flex-col h-full bg-white overflow-hidden border border-gray-200/60 md:border-r-0 md:border-t-0 md:border-b-0 md:border-l">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">
                  {ai.panelTitle}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-white/60 text-[11px]">
                    {ai.panelSubtitle}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title={ai.clearChat}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors md:hidden"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => {
              const hasListings =
                msg.role === "assistant" && !!msg.listings?.length;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 items-start ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Column wrapper expands to fill row when listing cards are present */}
                  <div
                    className={
                      hasListings
                        ? "flex-1 min-w-0 flex flex-col gap-2"
                        : "max-w-[80%]"
                    }
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 shadow-sm
                        ${hasListings ? "self-start max-w-[85%]" : ""}
                        ${
                          msg.role === "user"
                            ? "bg-emerald-600 text-white rounded-br-md"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                        }`}
                    >
                      {msg.streaming && msg.content === "" ? (
                        <TypingDots />
                      ) : msg.role === "assistant" ? (
                        <div
                          className="text-sm leading-relaxed prose-sm [&_strong]:font-semibold [&_em]:italic [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_p]:mb-1 [&_p:last-child]:mb-0"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(msg.content),
                          }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                      {msg.streaming && msg.content !== "" && (
                        <span className="inline-block w-0.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>

                    {/* Listing cards — horizontal snap scroll outside the bubble */}
                    {hasListings && (
                      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {msg.listings!.map((listing) => (
                          <a
                            key={listing.id}
                            href={`/listing/${listing.id}`}
                            className="group flex-none w-[40%] min-w-[118px] snap-start rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg active:scale-[0.97] transition-all duration-200 [touch-action:manipulation]"
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                              {listing.image_url ? (
                                <img
                                  src={listing.image_url}
                                  alt={listing.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex flex-col gap-0.5">
                              <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-snug">
                                {listing.title}
                              </p>
                              <p className="text-[11px] font-bold text-emerald-600">
                                {listing.currency || "XAF"}{" "}
                                {Number(listing.price).toLocaleString()}
                              </p>
                              {(listing.condition ||
                                listing.city ||
                                listing.location) && (
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  {listing.condition && (
                                    <span className="text-[9px] font-medium text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5 capitalize leading-none">
                                      {listing.condition}
                                    </span>
                                  )}
                                  {(listing.city || listing.location) && (
                                    <span className="text-[9px] text-gray-400 truncate">
                                      {listing.city || listing.location}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 flex items-start gap-2">
                <svg
                  className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Quick suggestion chips (only shown when only welcome message) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isStreaming}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-medium shadow-sm disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400/30 transition-all px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={ai.inputPlaceholder}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none max-h-24 leading-relaxed disabled:opacity-60"
                style={{
                  overflowY: input.split("\n").length > 2 ? "auto" : "hidden",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
              >
                {isStreaming ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-1.5">
              {ai.poweredBy}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
