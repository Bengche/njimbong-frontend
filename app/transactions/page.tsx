"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  source: "wallet" | "order";
  type:
    | "deposit"
    | "withdrawal"
    | "escrow_pay"
    | "purchase"
    | "sale"
    | "refund"
    | "dispute";
  direction: "in" | "out" | "pending";
  amount: number;
  currency: string;
  status: string;
  description: string;
  counterparty: string | null;
  listing_title: string | null;
  reference: string | null;
  order_reference: string | null;
  order_id: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency = "XAF"): string {
  return (
    Number(amount).toLocaleString("fr-CM") + "\u00a0" + (currency || "XAF")
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGroupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (txDay.getTime() === today.getTime()) return "Today";
  if (txDay.getTime() === yesterday.getTime()) return "Yesterday";

  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function txTitle(tx: Transaction): string {
  const map: Record<string, string> = {
    deposit: "Wallet top-up",
    withdrawal: "Wallet withdrawal",
    escrow_pay: "Escrow payment",
    purchase: tx.listing_title || "Purchase",
    sale: tx.listing_title || "Sale",
    refund: tx.listing_title ? `Refund — ${tx.listing_title}` : "Refund",
    dispute: tx.listing_title
      ? `Dispute — ${tx.listing_title}`
      : "Dispute opened",
  };
  return map[tx.type] || tx.description || "Transaction";
}

function txSubtitle(tx: Transaction): string {
  const parts: string[] = [];
  if (tx.counterparty) parts.push(tx.counterparty);
  if (tx.reference) parts.push(tx.reference);
  if (tx.order_reference) parts.push(tx.order_reference);
  return parts.join("\u00a0·\u00a0") || formatDate(tx.created_at);
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: "Completed",
    released: "Completed",
    refunded: "Refunded",
    paid_in_escrow: "In Escrow",
    pending: "Processing",
    processing: "Processing",
    disputed: "Disputed",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return map[status] || status;
}

function statusDotColor(status: string): string {
  const map: Record<string, string> = {
    completed: "bg-emerald-500",
    released: "bg-emerald-500",
    refunded: "bg-emerald-500",
    paid_in_escrow: "bg-blue-500",
    pending: "bg-amber-400",
    processing: "bg-amber-400",
    disputed: "bg-red-500",
    failed: "bg-gray-400",
    cancelled: "bg-gray-400",
  };
  return map[status] || "bg-gray-400";
}

// ─── Transaction Icon ─────────────────────────────────────────────────────────

function TxIcon({ tx }: { tx: Transaction }) {
  const isIn = tx.direction === "in";
  const isPending = tx.direction === "pending";

  const bgClass = isIn
    ? "bg-emerald-50"
    : isPending
      ? "bg-gray-50"
      : "bg-gray-100";

  const iconPath = (() => {
    if (tx.type === "deposit") return "M12 16v-8m-4 4l4 4 4-4";
    if (tx.type === "withdrawal") return "M12 8v8m-4-4l4-4 4 4";
    if (tx.type === "sale") return "M12 16v-8m-4 4l4 4 4-4";
    if (tx.type === "refund") return "M12 16v-8m-4 4l4 4 4-4";
    if (tx.type === "dispute")
      return "M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93";
    // purchase / escrow_pay
    return "M12 8v8m-4-4l4-4 4 4";
  })();

  const strokeColor = isIn
    ? "#16a34a"
    : tx.type === "dispute"
      ? "#dc2626"
      : "#374151";

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass}`}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPath} />
      </svg>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`rounded-full flex-shrink-0 ${statusDotColor(status)} ${
          large ? "w-2 h-2" : "w-1.5 h-1.5"
        }`}
      />
      <span
        className={`font-semibold text-gray-600 ${
          large ? "text-[13px]" : "text-[11px] font-medium text-gray-500"
        }`}
      >
        {statusLabel(status)}
      </span>
    </span>
  );
}

// ─── Transaction Detail Panel ─────────────────────────────────────────────────

function DetailPanel({
  tx,
  onClose,
  onDownload,
  downloading,
}: {
  tx: Transaction;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const isIn = tx.direction === "in";
  const amtSign = isIn ? "+" : tx.direction === "pending" ? "" : "−";
  const amtColor = isIn ? "text-emerald-600" : "text-gray-900";

  const rows: Array<[string, string]> = [
    ["Date", formatDateLong(tx.created_at)],
    ["Time", formatTime(tx.created_at)],
    ["Type", txTitle(tx)],
    ...(tx.counterparty
      ? ([["Counterparty", tx.counterparty]] as Array<[string, string]>)
      : []),
    ...(tx.listing_title
      ? ([["Item", tx.listing_title]] as Array<[string, string]>)
      : []),
    ...(tx.reference
      ? ([["Reference", tx.reference]] as Array<[string, string]>)
      : []),
    ...(tx.order_reference
      ? ([["Order ref.", tx.order_reference]] as Array<[string, string]>)
      : []),
    ["Transaction ID", tx.id],
  ];

  return (
    <>
      {/* Backdrop — above AI chat widget (z-[70]) */}
      <div
        className="fixed inset-0 bg-black/30 z-[85] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — side on desktop, bottom sheet on mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-96 bg-white z-[90] shadow-2xl flex flex-col rounded-t-2xl sm:rounded-none overflow-hidden">
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Transaction details
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Amount hero */}
        <div className="px-6 py-8 border-b border-gray-100 bg-gray-50 flex flex-col items-center text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.18em] mb-4">
            {isIn ? "Received" : tx.direction === "pending" ? "Pending" : "Sent"}
          </p>
          <p
            className={`text-[42px] font-bold tracking-tight tabular-nums leading-none ${amtColor}`}
          >
            {amtSign}{Number(tx.amount).toLocaleString("fr-CM")}
          </p>
          <p className="text-sm font-semibold text-gray-400 mt-2 tracking-wide">
            {tx.currency || "XAF"}
          </p>
          <div className="mt-5 flex items-center justify-center">
            <StatusBadge status={tx.status} large />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="py-3 flex items-start justify-between gap-4 border-b border-gray-50"
            >
              <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5 w-28">
                {label}
              </span>
              <span className="text-xs text-gray-800 font-medium text-right break-all">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Download button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="w-full h-10 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating receipt…
              </>
            ) : (
              <>
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16v-8m-4 4l4 4 4-4M20 21H4" />
                </svg>
                Download receipt
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

type FilterDirection = "all" | "in" | "out";
type FilterType =
  | "all"
  | "deposit"
  | "withdrawal"
  | "purchase"
  | "sale"
  | "refund";

const DIRECTION_TABS: { key: FilterDirection; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in", label: "Received" },
  { key: "out", label: "Sent" },
];

const TYPE_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All types" },
  { key: "deposit", label: "Deposits" },
  { key: "withdrawal", label: "Withdrawals" },
  { key: "purchase", label: "Purchases" },
  { key: "sale", label: "Sales" },
  { key: "refund", label: "Refunds" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [filterDir, setFilterDir] = useState<FilterDirection>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load transactions.");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Derived: filtered + grouped ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = transactions;

    if (filterDir !== "all") {
      list = list.filter((tx) =>
        filterDir === "in"
          ? tx.direction === "in"
          : tx.direction === "out" || tx.direction === "pending",
      );
    }

    if (filterType !== "all") {
      list = list.filter((tx) => {
        if (filterType === "purchase")
          return tx.type === "purchase" || tx.type === "escrow_pay";
        return tx.type === filterType;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (tx) =>
          (tx.description && tx.description.toLowerCase().includes(q)) ||
          (tx.counterparty && tx.counterparty.toLowerCase().includes(q)) ||
          (tx.listing_title && tx.listing_title.toLowerCase().includes(q)) ||
          (tx.reference && tx.reference.toLowerCase().includes(q)) ||
          (tx.order_reference && tx.order_reference.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [transactions, filterDir, filterType, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const key = getGroupLabel(tx.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // ── Derived: summary stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const tx of transactions) {
      if (tx.direction === "in") totalIn += Number(tx.amount);
      else if (tx.direction === "out") totalOut += Number(tx.amount);
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [transactions]);

  // ── Download CSV ─────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const res = await fetch(`${API_BASE}/api/transactions/export`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        "njimbong-transactions-" +
        new Date().toISOString().slice(0, 10) +
        ".csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — the user will notice the download didn't start
    } finally {
      setExportingCsv(false);
    }
  };

  // ── Download receipt ─────────────────────────────────────────────────────────
  const handleDownloadReceipt = async () => {
    if (!selected) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/transactions/${encodeURIComponent(selected.id)}/receipt`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Receipt generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `njimbong-receipt-${selected.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                Transactions
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Your complete payment history
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={exportingCsv || loading}
              className="flex-shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-600 disabled:opacity-50 transition-colors"
            >
              {exportingCsv ? (
                <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg
                  width={13}
                  height={13}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16v-8m-4 4l4 4 4-4M20 21H4" />
                </svg>
              )}
              Export CSV
            </button>
          </div>

          {/* ── Summary strip ── */}
          {!loading && transactions.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Total received",
                  value: stats.totalIn,
                  positive: true,
                },
                {
                  label: "Total sent",
                  value: stats.totalOut,
                  positive: false,
                },
                {
                  label: "Net",
                  value: Math.abs(stats.net),
                  positive: stats.net >= 0,
                  prefix: stats.net >= 0 ? "+" : "−",
                },
              ].map(({ label, value, positive, prefix }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 bg-white px-4 py-3.5"
                >
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">
                    {label}
                  </p>
                  <p
                    className={`text-base font-bold tabular-nums leading-none ${
                      positive ? "text-emerald-600" : "text-gray-900"
                    }`}
                  >
                    {prefix || ""}
                    {formatAmount(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3 overflow-x-auto no-scrollbar">
            {/* Direction tabs */}
            <div className="flex items-center gap-1 flex-shrink-0 bg-gray-100 p-0.5 rounded-lg">
              {DIRECTION_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterDir(tab.key)}
                  className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
                    filterDir === tab.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type select */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="h-8 pl-3 pr-7 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-shrink-0 cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative flex-1 min-w-32">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <circle cx={11} cy={11} r={8} />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions"
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-2/5" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-20" />
                    <div className="h-2.5 bg-gray-100 rounded w-12 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
            <button
              onClick={fetchTransactions}
              className="ml-3 font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth={1.8}
                strokeLinecap="round"
              >
                <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              No transactions yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your payment history will appear here.
            </p>
          </div>
        )}

        {/* No results for filter */}
        {!loading &&
          !error &&
          transactions.length > 0 &&
          filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500">
                No transactions match your filters.
              </p>
              <button
                onClick={() => {
                  setFilterDir("all");
                  setFilterType("all");
                  setSearch("");
                }}
                className="text-xs font-medium text-emerald-600 mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Transaction groups */}
        {!loading &&
          !error &&
          grouped.map(([groupLabel, txList]) => (
            <div key={groupLabel} className="mb-7">
              {/* Group header */}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                {groupLabel}
              </p>

              {/* Rows container */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {txList.map((tx) => {
                  const isIn = tx.direction === "in";
                  const isPending = tx.direction === "pending";
                  const amtSign = isIn ? "+" : isPending ? "" : "−";
                  const amtColor = isIn ? "text-emerald-600" : "text-gray-900";

                  return (
                    <button
                      key={tx.id}
                      onClick={() => setSelected(tx)}
                      className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left gap-3 group"
                    >
                      <TxIcon tx={tx} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate leading-snug">
                          {txTitle(tx)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {txSubtitle(tx)}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <p
                          className={`text-sm font-semibold tabular-nums leading-snug ${amtColor}`}
                        >
                          {amtSign}
                          {formatAmount(tx.amount, tx.currency)}
                        </p>
                        <div className="mt-0.5">
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg
                        className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors ml-1"
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <DetailPanel
          tx={selected}
          onClose={() => setSelected(null)}
          onDownload={handleDownloadReceipt}
          downloading={downloading}
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
