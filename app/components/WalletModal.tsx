"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "https://njimbong-backend-production.up.railway.app";

type Tab = "overview" | "deposit" | "withdraw";

interface Props {
  initialTab: Tab;
  balance: number;
  onClose: () => void;
}

type DepositStep = "form" | "pending" | "success" | "failed" | "timeout";

const DEPOSIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 3_000;
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 500_000;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("237")) return digits;
  return `237${digits}`;
}

function isValidPhone(phone: string): boolean {
  return /^237[62]\d{8}$/.test(phone);
}

function formatXAF(n: number): string {
  return n.toLocaleString("fr-CM") + " XAF";
}

function stripCountryCode(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("237") ? digits.slice(3) : digits;
}

export default function WalletModal({
  initialTab,
  balance: initialBalance,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // ── Live balance (re-fetched when modal opens) ──────────────────────────────
  const [liveBalance, setLiveBalance] = useState<number>(initialBalance);
  useEffect(() => {
    fetch(`${API_BASE}/api/wallet/balance`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d) => d && typeof d.balance === "number" && setLiveBalance(d.balance),
      )
      .catch(() => {});
  }, []);

  // ── Saved MoMo phone ────────────────────────────────────────────────────────
  const [savedPhone, setSavedPhone] = useState("");
  useEffect(() => {
    fetch(`${API_BASE}/api/wallet/momo-phone`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.phone && setSavedPhone(stripCountryCode(d.phone)))
      .catch(() => {});
  }, []);

  // ── Deposit state ───────────────────────────────────────────────────────────
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhone, setDepositPhone] = useState(savedPhone);
  const [depositStep, setDepositStep] = useState<DepositStep>("form");
  const [depositRef, setDepositRef] = useState<string | null>(null);
  const [depositError, setDepositError] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill phone once savedPhone loads
  useEffect(() => {
    if (savedPhone && !depositPhone) setDepositPhone(savedPhone);
  }, [savedPhone]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const pollDepositStatus = useCallback(
    (ref: string) => {
      const poll = async () => {
        try {
          const r = await fetch(
            `${API_BASE}/api/wallet/deposit/${ref}/status`,
            {
              credentials: "include",
            },
          );
          if (!r.ok) return;
          const data = await r.json();
          const s: string = data.status ?? "";
          if (s === "completed" || s === "success") {
            stopPolling();
            setCreditedAmount(data.amount ?? Number(depositAmount));
            setDepositStep("success");
            // Refresh live balance
            fetch(`${API_BASE}/api/wallet/balance`, { credentials: "include" })
              .then((r2) => (r2.ok ? r2.json() : null))
              .then(
                (d) =>
                  d &&
                  typeof d.balance === "number" &&
                  setLiveBalance(d.balance),
              )
              .catch(() => {});
          } else if (s === "failed" || s === "expired") {
            stopPolling();
            setDepositStep("failed");
          }
        } catch {
          // network hiccup — keep polling
        }
      };
      pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    },
    [depositAmount, stopPolling],
  );

  const handleDeposit = async () => {
    setDepositError("");
    const amount = Number(depositAmount);
    if (
      !depositAmount ||
      isNaN(amount) ||
      amount < MIN_AMOUNT ||
      amount > MAX_AMOUNT
    ) {
      setDepositError(
        `Amount must be between ${formatXAF(MIN_AMOUNT)} and ${formatXAF(MAX_AMOUNT)}.`,
      );
      return;
    }
    const phone = "237" + depositPhone;
    if (!isValidPhone(phone)) {
      setDepositError(
        "Enter a valid 9-digit MTN or Orange number (e.g. 677 123 456).",
      );
      return;
    }
    setDepositLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/wallet/deposit/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, phone }),
      });
      const data = await r.json();
      if (!r.ok) {
        setDepositError(
          data.error || "Failed to initiate deposit. Please try again.",
        );
        return;
      }
      setDepositRef(data.reference);
      setDepositStep("pending");
      // Start timeout
      timeoutTimerRef.current = setTimeout(() => {
        stopPolling();
        setDepositStep("timeout");
      }, DEPOSIT_TIMEOUT_MS);
      pollDepositStatus(data.reference);
    } catch {
      setDepositError("Network error. Please try again.");
    } finally {
      setDepositLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Withdraw state ──────────────────────────────────────────────────────────
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState(savedPhone);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<number | null>(null);

  useEffect(() => {
    if (savedPhone && !withdrawPhone) setWithdrawPhone(savedPhone);
  }, [savedPhone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWithdraw = async () => {
    setWithdrawError("");
    const amount = Number(withdrawAmount);
    if (
      !withdrawAmount ||
      isNaN(amount) ||
      amount < MIN_AMOUNT ||
      amount > MAX_AMOUNT
    ) {
      setWithdrawError(
        `Amount must be between ${formatXAF(MIN_AMOUNT)} and ${formatXAF(MAX_AMOUNT)}.`,
      );
      return;
    }
    if (amount > liveBalance) {
      setWithdrawError(
        `Insufficient balance. Your current balance is ${formatXAF(liveBalance)}.`,
      );
      return;
    }
    const phone = "237" + withdrawPhone;
    if (!isValidPhone(phone)) {
      setWithdrawError(
        "Enter a valid 9-digit MTN or Orange number (e.g. 677 123 456).",
      );
      return;
    }
    setWithdrawLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/wallet/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, phone }),
      });
      const data = await r.json();
      if (!r.ok) {
        setWithdrawError(data.error || "Withdrawal failed. Please try again.");
        return;
      }
      setWithdrawSuccess(amount);
      setLiveBalance((b) => b - amount);
      setWithdrawAmount("");
    } catch {
      setWithdrawError("Network error. Please try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const depositFee = depositAmount
    ? Math.ceil(Number(depositAmount) * 0.015)
    : 0;
  const depositTotal = depositAmount ? Number(depositAmount) + depositFee : 0;

  // ── Backdrop click to close ─────────────────────────────────────────────────
  const backdropRef = useRef<HTMLDivElement>(null);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "deposit", label: "Deposit" },
    { key: "withdraw", label: "Withdraw" },
  ];

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90dvh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-green-700 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight">
              Njimbong Wallet
            </h2>
            <p className="text-emerald-100 text-xs mt-0.5">
              Balance:{" "}
              <span className="font-semibold text-white">
                {formatXAF(liveBalance)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Close wallet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === t.key
                  ? "text-emerald-700 border-b-2 border-emerald-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="bg-emerald-50 rounded-xl p-5 text-center">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">
                  Available Balance
                </p>
                <p className="text-3xl font-bold text-emerald-800 tabular-nums">
                  {formatXAF(liveBalance)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Central African Franc (XAF)
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-600">
                <h3 className="font-semibold text-gray-800 text-base">
                  How it works
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Deposit</strong> — Add funds via MoMo. A{" "}
                    <strong>1.5% fee</strong> is charged on top of your deposit
                    amount. Standard MTN / Orange operator charges may also
                    apply.
                  </li>
                  <li>
                    <strong>Withdraw</strong> — Send funds to your MoMo number.{" "}
                    <strong>No withdrawal fee</strong>.
                  </li>
                  <li>
                    <strong>Secure purchases</strong> — Buy listings directly
                    from your wallet. Funds are held safely in escrow until you
                    confirm delivery.
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("deposit")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Deposit
                </button>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className="flex-1 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold py-3 rounded-xl transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}

          {/* ── Deposit ── */}
          {activeTab === "deposit" && (
            <div className="space-y-5">
              {depositStep === "form" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (XAF)
                    </label>
                    <input
                      type="number"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {depositAmount && Number(depositAmount) >= MIN_AMOUNT && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Credited to wallet:</span>
                          <span className="font-semibold">
                            {formatXAF(Number(depositAmount))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing fee (1.5%):</span>
                          <span className="font-semibold">
                            +{formatXAF(depositFee)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                          <span className="font-medium">
                            You will be charged:
                          </span>
                          <span className="font-bold">
                            {formatXAF(depositTotal)}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700 pt-0.5">
                          * Standard MoMo operator charges (MTN / Orange) may
                          also apply on top of this amount.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MoMo Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm font-medium select-none">
                        +237
                      </span>
                      <input
                        type="tel"
                        value={depositPhone}
                        onChange={(e) =>
                          setDepositPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 9),
                          )
                        }
                        placeholder="677 123 456"
                        className="flex-1 border border-gray-300 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      MTN or Orange Cameroon. Enter 9 digits starting with 6
                      (MTN) or 2 (Orange).
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Important:</strong> Please ensure this MoMo number
                      belongs to you. In the event of a dispute or required
                      refund on any purchase made using your wallet balance,
                      funds will be returned to this number.
                    </p>
                  </div>

                  {depositError && (
                    <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                      {depositError}
                    </p>
                  )}

                  <button
                    onClick={handleDeposit}
                    disabled={depositLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {depositLoading ? "Initiating…" : "Initiate Deposit"}
                  </button>
                </>
              )}

              {depositStep === "pending" && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <svg
                      className="animate-spin w-7 h-7 text-emerald-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    Awaiting MoMo approval
                  </h3>
                  <p className="text-sm text-gray-500">
                    A payment prompt has been sent to{" "}
                      <strong>+237{depositPhone}</strong>.<br />
                    Approve it on your phone to complete the deposit.
                  </p>
                  <p className="text-xs text-gray-400">
                    Reference: <span className="font-mono">{depositRef}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    This page will update automatically.
                  </p>
                </div>
              )}

              {depositStep === "success" && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-8 h-8 text-emerald-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.97 3.97-1.72-1.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.5-4.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    Deposit successful!
                  </h3>
                  {creditedAmount !== null && (
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-emerald-700">
                        {formatXAF(creditedAmount)}
                      </span>{" "}
                      has been added to your wallet.
                    </p>
                  )}
                  <p className="text-sm font-semibold text-emerald-700">
                    New balance: {formatXAF(liveBalance)}
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {(depositStep === "failed" || depositStep === "timeout") && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-8 h-8 text-red-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.03-4.28a.75.75 0 0 0-1.06 0L10 9.94l-2.22-2.22a.75.75 0 1 0-1.06 1.06L8.94 11l-2.22 2.22a.75.75 0 1 0 1.06 1.06L10 12.06l2.22 2.22a.75.75 0 1 0 1.06-1.06L11.06 11l2.22-2.22a.75.75 0 0 0 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {depositStep === "timeout"
                      ? "Deposit timed out"
                      : "Deposit failed"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {depositStep === "timeout"
                      ? "No MoMo confirmation was received within 5 minutes. No funds were deducted."
                      : "The deposit was declined or failed. No funds were deducted."}
                  </p>
                  <button
                    onClick={() => {
                      setDepositStep("form");
                      setDepositRef(null);
                      setDepositError("");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Withdraw ── */}
          {activeTab === "withdraw" && (
            <div className="space-y-5">
              {withdrawSuccess !== null ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-8 h-8 text-emerald-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.97 3.97-1.72-1.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.5-4.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    Withdrawal initiated!
                  </h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-emerald-700">
                      {formatXAF(withdrawSuccess)}
                    </span>{" "}
                    is being sent to <strong>+237{withdrawPhone}</strong>.
                  </p>
                  <p className="text-sm font-semibold text-emerald-700">
                    New balance: {formatXAF(liveBalance)}
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 rounded-xl px-4 py-3 text-sm">
                    <span className="text-emerald-700">Available: </span>
                    <span className="font-bold text-emerald-800">
                      {formatXAF(liveBalance)}
                    </span>
                    <span className="text-gray-500 ml-2 text-xs">
                      · No withdrawal fee
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (XAF)
                    </label>
                    <input
                      type="number"
                      min={MIN_AMOUNT}
                      max={liveBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MoMo Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm font-medium select-none">
                        +237
                      </span>
                      <input
                        type="tel"
                        value={withdrawPhone}
                        onChange={(e) =>
                          setWithdrawPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 9),
                          )
                        }
                        placeholder="677 123 456"
                        className="flex-1 border border-gray-300 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      MTN or Orange Cameroon. Enter 9 digits starting with 6
                      (MTN) or 2 (Orange).
                    </p>
                  </div>

                  {withdrawError && (
                    <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                      {withdrawError}
                    </p>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {withdrawLoading ? "Processing…" : "Withdraw to MoMo"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
