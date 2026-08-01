"use client";
import { useState, useEffect } from "react";
import Axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface BuyerRequest {
  id: number;
  title: string;
  description: string;
  category_name?: string | null;
  tags?: string[] | null;
  image_url?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  currency: string;
  country?: string | null;
  city?: string | null;
  username: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (listingId: number) => void;
  request: BuyerRequest;
}

const CURRENCIES = ["XAF", "USD", "EUR", "GBP", "NGN", "GHS"];
const CONDITIONS = [
  { value: "new", label: "Brand New" },
  { value: "like-new", label: "Like New (barely used)" },
  { value: "good", label: "Good (minor wear)" },
  { value: "fair", label: "Fair (visible wear)" },
  { value: "refurbished", label: "Refurbished" },
];
const DELIVERY_TYPES = [
  { value: "pickup", label: "Pickup only" },
  { value: "delivery", label: "Delivery available" },
  { value: "both", label: "Pickup or Delivery" },
];

export default function FulfillRequestModal({
  isOpen,
  onClose,
  onSuccess,
  request,
}: Props) {
  const [formData, setFormData] = useState({
    price: "",
    currency: "XAF",
    condition: "new",
    city: "",
    country: "Cameroon",
    seller_email: "",
    seller_phone: "",
    delivery_type: "pickup",
    delivery_notes: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        price: "",
        currency: request.currency || "XAF",
        condition: "new",
        city: request.city || "",
        country: request.country || "Cameroon",
        seller_email: "",
        seller_phone: "",
        delivery_type: "pickup",
        delivery_notes: "",
        message: "",
      });
      setError("");
    }
  }, [isOpen, request]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (
      !formData.price ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      return setError("Please enter a valid price.");
    }
    if (!formData.seller_phone.trim()) {
      return setError("A contact phone number is required.");
    }
    if (!formData.city.trim() || !formData.country.trim()) {
      return setError("City and country are required.");
    }

    setSubmitting(true);
    try {
      const response = await Axios.post(
        `${API_BASE}/api/requests/${request.id}/fulfill`,
        formData,
        { withCredentials: true },
      );
      onSuccess(response.data.listing_id);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to submit. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const budgetHint =
    request.budget_min || request.budget_max
      ? `Buyer's budget: ${request.budget_min ? request.budget_min.toLocaleString() : "–"} – ${request.budget_max ? request.budget_max.toLocaleString() : "–"} ${request.currency}`
      : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Fulfill This Request
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Set your price and contact details — a listing is created
              instantly
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-700 -mr-1 flex-shrink-0 mt-0.5"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* Request summary (locked / read-only) */}
          <div className="mx-5 mt-4 rounded-xl border border-emerald-100 bg-emerald-50 overflow-hidden flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 border-b border-emerald-100">
              <svg
                className="w-4 h-4 text-emerald-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs font-semibold text-emerald-700">
                Auto-filled from buyer's request — cannot be changed
              </span>
            </div>
            <div className="p-4 flex gap-3">
              {request.image_url && (
                <img
                  src={request.image_url}
                  alt={request.title}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-emerald-100"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 text-sm leading-snug">
                  {request.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {request.description}
                </p>
                {request.category_name && (
                  <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    {request.category_name}
                  </span>
                )}
              </div>
            </div>
            {budgetHint && (
              <div className="px-4 pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full font-medium">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.028 2.353 1.118V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.028-2.354-1.118V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {budgetHint}
                </span>
              </div>
            )}
          </div>

          {/* Seller form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Your Selling Price <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-24 flex-shrink-0 px-3 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none text-sm bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., 150000"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition"
                  required
                />
              </div>
              {budgetHint && (
                <p className="text-xs text-gray-400 mt-1">{budgetHint}</p>
              )}
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Item Condition <span className="text-red-500">*</span>
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white transition"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Country <span className="text-red-500">*</span>
                </label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Cameroon"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your City <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Douala"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  name="seller_phone"
                  value={formData.seller_phone}
                  onChange={handleChange}
                  placeholder="e.g., 237 6XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Email
                </label>
                <input
                  name="seller_email"
                  type="email"
                  value={formData.seller_email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition"
                />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Delivery Options
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DELIVERY_TYPES.map((d) => (
                  <label
                    key={d.value}
                    className={[
                      "flex flex-col items-center text-center px-3 py-2.5 rounded-xl border-2 cursor-pointer transition text-xs font-semibold",
                      formData.delivery_type === d.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="delivery_type"
                      value={d.value}
                      checked={formData.delivery_type === d.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {d.label}
                  </label>
                ))}
              </div>
              {formData.delivery_type !== "pickup" && (
                <input
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleChange}
                  placeholder="Delivery details (area, cost, etc.)"
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition"
                />
              )}
            </div>

            {/* Message to buyer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Message to Buyer{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={2}
                placeholder="Add any extra info for the buyer — e.g., original box included, warranty still valid, etc."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition resize-none"
                maxLength={500}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 min-w-[160px]"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Listing…
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                I Have This — Fulfill
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
