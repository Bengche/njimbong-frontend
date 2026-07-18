"use client";
import { useState } from "react";
import Axios from "axios";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderReference: string;
  listingTitle: string;
  myRole: "buyer" | "seller";
  onDisputeFiled?: () => void;
}

export default function DisputeModal({
  isOpen,
  onClose,
  orderId,
  orderReference,
  listingTitle,
  myRole,
  onDisputeFiled,
}: DisputeModalProps) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (description.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("description", description.trim());
      images.forEach((img) => form.append("evidence_images", img));

      await Axios.post(`${API_BASE}/api/orders/${orderId}/dispute`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      onDisputeFiled?.();
    } catch (err: unknown) {
      const msg = Axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(msg || "Failed to file dispute. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setImages([]);
    setPreviews([]);
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">File a Dispute</h2>
              <p className="text-white/80 text-sm mt-0.5">Order #{orderReference}</p>
            </div>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/20 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Dispute Filed</h3>
              <p className="text-gray-600 text-sm mb-2">
                Our team has been notified. The funds held in escrow are frozen pending review.
              </p>
              <p className="text-gray-500 text-xs mb-6">
                We will review within 24–48 business hours and contact both parties.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-semibold mb-1">Before you file a dispute</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {myRole === "buyer"
                    ? "Have you contacted the seller? Most issues can be resolved through chat. Filing a dispute freezes the escrow funds for both parties until our team reviews the case."
                    : "Have you contacted the buyer? Filing a dispute freezes the escrow funds for both parties until our team reviews the case."}
                </p>
              </div>

              {/* Listing reference */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Item in dispute</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{listingTitle}</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Describe the issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); }}
                  placeholder={
                    myRole === "buyer"
                      ? "e.g. Item received does not match the description. The phone had a cracked screen not shown in the photos."
                      : "e.g. The buyer is claiming the item is damaged but it was in perfect condition when delivered."
                  }
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/1000</p>
              </div>

              {/* Evidence images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Evidence photos{" "}
                  <span className="text-gray-400 font-normal">(optional, max 5)</span>
                </label>
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {previews.length < 5 && (
                  <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50 transition text-sm text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
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
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Filing...
                    </>
                  ) : (
                    "File Dispute"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
