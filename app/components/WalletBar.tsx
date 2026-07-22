"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import WalletModal from "./WalletModal";

type ModalTab = "overview" | "deposit" | "withdraw";

const API_BASE = "https://njimbong-backend-production.up.railway.app";
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
    fetch(`${API_BASE}/api/user/me`, { credentials: "include" })
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
      const r = await fetch(`${API_BASE}/api/wallet/balance`, {
        credentials: "include",
      });
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
    balance === null ? "—" : `${balance.toLocaleString("fr-CM")} XAF`;

  return (
    <>
      <div className="sticky top-16 z-30 w-full bg-gradient-to-r from-emerald-700 to-green-700 text-white shadow-md">
        <button
          onClick={() => openModal("overview")}
          className="w-full flex items-center justify-between px-4 h-10 text-sm font-medium hover:brightness-110 transition-all"
          aria-label="Open wallet"
        >
          {/* Left: icon + balance */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M2.273 5.625A4.483 4.483 0 0 1 5.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 3H5.25a3 3 0 0 0-2.977 2.625ZM2.273 8.625A4.483 4.483 0 0 1 5.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 6H5.25a3 3 0 0 0-2.977 2.625ZM5.25 9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3H5.25Zm7.5 6.75a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 1.5 0V15a.75.75 0 0 1-.75.75Z" />
            </svg>
            <span className="text-emerald-100 text-xs font-medium">Wallet</span>
            <span className="font-bold tracking-tight">
              {loadingBalance && balance === null ? "Loading…" : displayBalance}
            </span>
          </div>

          {/* Right: tap hint */}
          <div className="flex items-center gap-1 text-emerald-200 text-xs">
            <span>Manage</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>
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
