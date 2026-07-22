"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import WalletModal from "./WalletModal";

type ModalTab = "overview" | "deposit" | "withdraw";

const BALANCE_POLL_INTERVAL = 60_000; // 60 seconds

export default function WalletBar() {
  const [userId, setUserId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>("overview");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check auth
  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setUserId(data.id);
      })
      .catch(() => {});
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    setLoadingBalance(true);
    try {
      const r = await fetch("/api/wallet/balance", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setBalance(typeof data.balance === "number" ? data.balance : 0);
      }
    } catch {
      // silent — keep showing stale balance
    } finally {
      setLoadingBalance(false);
    }
  }, [userId]);

  // Fetch balance on auth, then poll
  useEffect(() => {
    if (!userId) return;
    fetchBalance();
    intervalRef.current = setInterval(fetchBalance, BALANCE_POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchBalance]);

  const openModal = (tab: ModalTab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    fetchBalance(); // refresh after deposit/withdraw
  };

  // Only render for authenticated users
  if (!userId) return null;

  const displayBalance =
    balance === null
      ? "—"
      : `${balance.toLocaleString("fr-CM")} XAF`;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-emerald-700 to-green-700 text-white flex items-center justify-between px-4 h-11 text-sm font-medium shadow-md z-40">
        {/* Left: balance */}
        <button
          onClick={() => openModal("overview")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Open wallet"
        >
          {/* Wallet icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 shrink-0"
            aria-hidden="true"
          >
            <path d="M2.273 5.625A4.483 4.483 0 0 1 5.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 3H5.25a3 3 0 0 0-2.977 2.625ZM2.273 8.625A4.483 4.483 0 0 1 5.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 6H5.25a3 3 0 0 0-2.977 2.625ZM5.25 9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3H5.25Zm7.5 6.75a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 1.5 0V15a.75.75 0 0 1-.75.75Z" />
          </svg>
          <span>
            Wallet:{" "}
            <span className="font-semibold">
              {loadingBalance && balance === null ? "Loading…" : displayBalance}
            </span>
          </span>
        </button>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal("deposit")}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          >
            <span>+</span> Deposit
          </button>
          <button
            onClick={() => openModal("withdraw")}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          >
            <span>↑</span> Withdraw
          </button>
        </div>
      </div>

      {modalOpen && (
        <WalletModal
          initialTab={modalTab}
          balance={balance ?? 0}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
