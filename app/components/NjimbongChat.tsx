"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm **Njimbong AI** — your smart marketplace assistant.\n\nI can help you find products, price items fairly, create better listings, stay safe online, and much more.\n\nWhat can I help you with today?",
};

const QUICK_SUGGESTIONS = [
  "How do I sell something?",
  "Is this platform safe?",
  "How are prices determined?",
  "I need help finding a product",
];

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/dashboard": ["Find me a good deal", "What's trending?", "Tips to sell faster"],
  "/listing": ["Is this a fair price?", "How do I contact the seller?", "Tips for safe buying"],
  "/profile": ["How to boost my trust score", "Tips for my listings", "How to get verified"],
  "/chat": ["Help me write a message", "Summarize this conversation", "Negotiation tips"],
  "/sell": ["Help me write a description", "What price should I set?", "Best category for my item"],
};

function getPageSuggestions(pathname: string): string[] {
  const match = Object.keys(PAGE_SUGGESTIONS).find((k) => pathname?.includes(k));
  return match ? PAGE_SUGGESTIONS[match] : QUICK_SUGGESTIONS;
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

  const buildPageContext = () => {
    const page = pathname || "";
    if (page.includes("/listing/")) return "User is viewing a product listing page.";
    if (page.includes("/profile")) return "User is on a profile page.";
    if (page.includes("/chat")) return "User is in the messaging/chat section.";
    if (page.includes("/dashboard")) return "User is on the main marketplace dashboard browsing listings.";
    if (page.includes("/favorites")) return "User is viewing their favorite saved items.";
    if (page.includes("/orders")) return "User is viewing their orders.";
    if (page.includes("/safety")) return "User is on the safety and trust page.";
    return "User is browsing the Njimbong Marketplace.";
  };

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
          throw new Error(errData.error || `HTTP ${response.status}`);
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
        setError(err.message || "Njimbong AI is temporarily unavailable. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== streamId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        scrollToBottom();
      }
    },
    [isStreaming, messages, pathname, scrollToBottom],
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
      {/* ── Floating Button ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open Njimbong AI assistant"
        className={`fixed z-[70] bottom-20 right-4 md:bottom-7 md:right-7 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group
          ${isOpen ? "bg-slate-700 rotate-0 scale-95" : "bg-gradient-to-br from-slate-800 to-slate-900 hover:scale-110"}`}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        )}

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping pointer-events-none" />
        )}
      </button>

      {/* ── Chat Panel ───────────────────────────────────────────────────────── */}
      <div
        className={`fixed z-[70] transition-all duration-300 ease-in-out
          inset-0 md:inset-auto md:bottom-28 md:right-7 md:w-[390px] md:h-[580px]
          ${isOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-4 md:translate-y-6"}`}
        style={isOpen ? { boxShadow: "0 24px 64px rgba(0,0,0,0.28)" } : {}}
      >
        <div className="flex flex-col h-full bg-white md:rounded-2xl overflow-hidden border border-gray-200/60">

          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">Njimbong AI</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-white/60 text-[11px]">Online · Smart Marketplace Assistant</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors md:hidden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* AI avatar */}
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm
                    ${msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                    }`}
                >
                  {msg.streaming && msg.content === "" ? (
                    <TypingDots />
                  ) : msg.role === "assistant" ? (
                    <div
                      className="text-sm leading-relaxed prose-sm [&_strong]:font-semibold [&_em]:italic [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_p]:mb-1 [&_p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.streaming && msg.content !== "" && (
                    <span className="inline-block w-0.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                placeholder="Ask Njimbong AI anything..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none max-h-24 leading-relaxed disabled:opacity-60"
                style={{ overflowY: input.split("\n").length > 2 ? "auto" : "hidden" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
              >
                {isStreaming ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-1.5">
              Njimbong AI · Powered by Gemini
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
