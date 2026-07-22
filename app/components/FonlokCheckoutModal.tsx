"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";

Axios.defaults.withCredentials = true;

const API_BASE = "https://njimbong-backend-production.up.railway.app";

interface Props {
  listing: {
    id: number;
    title: string;
    price: number;
    currency: string;
  };
  onClose: () => void;
}

type CheckoutStep = "form" | "pending" | "success" | "failed";
type PaymentMethod = "momo" | "wallet";

// Poll intervals in ms — progressively longer to respect rate limits
const POLL_DELAYS = [3000, 5000, 8000, 10000, 15000, 30000];

export default function FonlokCheckoutModal({ listing, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>("form");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const pollingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wallet payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  useEffect(() => {
    return () => {
      if (pollingTimeout.current) clearTimeout(pollingTimeout.current);
    };
  }, []);

  // Fetch wallet balance when wallet tab is selected
  useEffect(() => {
    if (paymentMethod !== "wallet" || walletBalance !== null) return;
    fetch("/api/wallet/balance", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.balance === "number") setWalletBalance(d.balance);
      })
      .catch(() => setWalletBalance(0));
  }, [paymentMethod, walletBalance]);

  const handleWalletPay = async () => {
    setWalletError("");
    setWalletLoading(true);
    try {
      const res = await Axios.post(`${API_BASE}/api/payments/initiate-wallet`, {
        listing_id: listing.id,
      });
      if (res.data.status === "paid_in_escrow") {
        setStep("success");
      } else {
        setWalletError("Payment did not complete. Please try again.");
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { error?: string } };
      };
      if (axiosErr.response?.status === 409) {
        setWalletError(
          axiosErr.response.data?.error ||
            "Insufficient wallet balance. Please top up and try again.",
        );
      } else {
        setWalletError(
          axiosErr.response?.data?.error ??
            "Wallet payment failed. Please try again.",
        );
      }
    } finally {
      setWalletLoading(false);
    }
  };

  function startPolling(reference: string) {
    let index = 0;

    const poll = async () => {
      if (index >= POLL_DELAYS.length) return; // Max attempts reached — user can use Fonlok link
      try {
        const res = await Axios.get(
          `${API_BASE}/api/payments/${reference}/status`,
        );
        const { status } = res.data;

        if (status === "paid_in_escrow") {
          setStep("success");
          return;
        }
        if (status === "failed" || status === "cancelled") {
          setStep("failed");
          setError("The MoMo payment was not approved. Please try again.");
          return;
        }
        // Still pending — schedule next poll
        pollingTimeout.current = setTimeout(() => {
          index++;
          poll();
        }, POLL_DELAYS[index]);
      } catch {
        // Silent retry on network error
        pollingTimeout.current = setTimeout(() => {
          index++;
          poll();
        }, POLL_DELAYS[index] ?? 30000);
      }
    };

    pollingTimeout.current = setTimeout(poll, POLL_DELAYS[0]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const fullNumber = "237" + phoneInput;
    if (!/^237[62]\d{8}$/.test(fullNumber)) {
      setError(
        "Enter a valid Cameroonian MoMo number. MTN numbers start with 6, Orange with 2 (e.g. 670000000).",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await Axios.post(`${API_BASE}/api/payments/initiate`, {
        listing_id: listing.id,
        phone_number: fullNumber,
        buyer_email: emailInput.trim() || undefined,
      });
      setPaymentUrl(res.data.payment_url);
      setStep("pending");
      startPolling(res.data.fonlok_reference);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg =
        axiosErr.response?.data?.error ??
        "Payment initiation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Secure Checkout
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Protected by{" "}
              <a
                href="https://fonlok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Fonlok Escrow
              </a>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Listing summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            You are purchasing
          </p>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
            {listing.title}
          </p>
          <p className="text-xl font-bold text-emerald-600 mt-2">
            {listing.price.toLocaleString()} {listing.currency}
          </p>
        </div>

        {/* Step: form */}
        {step === "form" && (
          <div className="space-y-4">
            {/* Payment method selector */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("momo");
                  setWalletError("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  paymentMethod === "momo"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                MoMo Direct
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("wallet");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  paymentMethod === "wallet"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Wallet Balance
              </button>
            </div>

            {/* MoMo form */}
            {paymentMethod === "momo" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your email{" "}
                    <span className="text-gray-400 text-xs">
                      (For receipt & release confirmation.)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    required
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Money number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium select-none">
                      +237
                    </span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) =>
                        setPhoneInput(
                          e.target.value.replace(/\D/g, "").slice(0, 9),
                        )
                      }
                      placeholder="670000000"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-r-lg px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    MTN or Orange Cameroon. Enter 9 digits starting with 6 (MTN)
                    or 2 (Orange).
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  Your payment will be held securely in escrow by Fonlok. Funds
                  are only released to the seller after you confirm receipt of
                  the item.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {loading
                    ? "Initiating payment..."
                    : `Pay ${listing.price.toLocaleString()} ${listing.currency} via MoMo`}
                </button>
              </form>
            )}

            {/* Wallet payment */}
            {paymentMethod === "wallet" && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Wallet balance
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {walletBalance === null
                        ? "Loading…"
                        : `${walletBalance.toLocaleString("fr-CM")} XAF`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Order total
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {listing.price.toLocaleString()} {listing.currency}
                    </span>
                  </div>
                </div>

                {walletBalance !== null && walletBalance < listing.price && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                    Insufficient balance. You need{" "}
                    <strong>
                      {(listing.price - walletBalance).toLocaleString("fr-CM")}{" "}
                      XAF
                    </strong>{" "}
                    more.{" "}
                    <button
                      type="button"
                      onClick={onClose}
                      className="underline font-semibold"
                    >
                      Top up wallet
                    </button>
                  </div>
                )}

                {walletError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {walletError}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  Funds are deducted from your wallet instantly and held in
                  escrow. No MoMo prompt will be sent.
                </div>

                <button
                  type="button"
                  onClick={handleWalletPay}
                  disabled={
                    walletLoading ||
                    walletBalance === null ||
                    walletBalance < listing.price
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {walletLoading
                    ? "Processing…"
                    : `Pay ${listing.price.toLocaleString()} ${listing.currency} from Wallet`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: pending MoMo approval */}
        {step === "pending" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-500 animate-spin"
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
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Check your phone
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A Mobile Money payment request has been sent to{" "}
              <strong>+237{phoneInput}</strong>. Approve it on your phone to
              complete the purchase.
            </p>
            {paymentUrl && (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-emerald-600 underline"
              >
                Or complete payment on fonlok.com
              </a>
            )}
            <p className="text-xs text-gray-400">Waiting for confirmation...</p>
          </div>
        )}

        {/* Step: success */}
        {step === "success" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Payment secured!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your payment is safely held in escrow. The seller has been
              notified and will prepare your item. A confirmation email has been
              sent to you. Once you receive the item, go to your{" "}
              <span className="text-emerald-600 font-medium">Orders Page</span>{" "}
              to confirm receipt and release funds to the seller.
            </p>
            <button
              onClick={() => {
                onClose();
                router.push("/orders");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              View My Orders
            </button>
          </div>
        )}

        {/* Step: failed */}
        {step === "failed" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Payment not completed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => {
                setStep("form");
                setError("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
