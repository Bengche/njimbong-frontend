"use client";
import { useState } from "react";
import Axios from "axios";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
  askingPrice: number;
  currency: string;
  currencySymbol: string;
  onOfferSent?: () => void;
}

export default function MakeOfferModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  askingPrice,
  currency,
  currencySymbol,
  onOfferSent,
}: MakeOfferModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid offer amount.");
      return;
    }
    if (parsed >= askingPrice) {
      setError(
        `Your offer must be less than the asking price (${currencySymbol}${askingPrice.toLocaleString()}). To buy at full price, use the escrow button.`,
      );
      return;
    }
    if (currency === "XAF" && parsed < 500) {
      setError("Minimum offer amount is 500 XAF.");
      return;
    }

    setSubmitting(true);
    try {
      await Axios.post(`${API_BASE}/api/offers`, {
        listing_id: listingId,
        amount: parsed,
        message: message.trim() || undefined,
      });
      setSuccess(true);
      onOfferSent?.();
    } catch (err: unknown) {
      const msg =
        Axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(msg || "Failed to send offer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setMessage("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Make an Offer</h2>
              <p className="text-white/80 text-sm mt-0.5 truncate max-w-xs">
                {listingTitle}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-white/20 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Offer Sent!</h3>
              <p className="text-gray-600 text-sm mb-6">
                The seller has been notified and will respond within 48 hours.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Asking price reference */}
              <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">Asking price</span>
                <span className="font-bold text-gray-800 text-lg">
                  {currencySymbol}{askingPrice.toLocaleString()} {currency}
                </span>
              </div>

              {/* Offer amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Offer ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    placeholder={`e.g. ${Math.round(askingPrice * 0.85).toLocaleString()}`}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-semibold"
                    required
                  />
                </div>
                {amount && !isNaN(parseFloat(amount)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {((1 - parseFloat(amount) / askingPrice) * 100).toFixed(0)}% below asking price
                  </p>
                )}
              </div>

              {/* Optional message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Message to seller{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. I can pick up today. Would you consider this price?"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Offer"
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Offers expire after 48 hours. The seller can accept, counter, or decline.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
