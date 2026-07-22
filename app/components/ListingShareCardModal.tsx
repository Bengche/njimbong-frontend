"use client";
/**
 * ListingShareCardModal
 *
 * Shown automatically after a seller creates a listing.
 * - Generates a QR code for the listing URL
 * - Fetches the listing's first image and converts to base64 (avoids CORS issues with html-to-image)
 * - Renders a 9:16 branded card (360×640) and lets the seller download it as a 1080×1920 PNG
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { toBlob } from "html-to-image";
import QRCode from "qrcode";
import ListingShareCard, { type ShareCardData } from "./ListingShareCard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: number;
    title: string;
    price: string | number;
    currency: string;
    condition?: string;
    city?: string;
    country?: string;
    category?: string;
    imageUrl?: string; // first image URL (Cloudinary)
  };
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "https://njimbong.com");

// Convert a remote image URL to a base64 data URL to avoid CORS issues in html-to-image
async function urlToDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ListingShareCardModal({
  isOpen,
  onClose,
  listing,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardData, setCardData] = useState<ShareCardData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [prepError, setPrepError] = useState(false);

  // Prepare QR + image data when modal opens
  const prepare = useCallback(async () => {
    if (!isOpen || !listing?.id) return;
    setPrepError(false);
    setDownloadDone(false);

    const listingUrl = `${APP_URL}/listing/${listing.id}`;

    try {
      // 1. Generate QR code as base64 PNG
      const qrDataUrl = await QRCode.toDataURL(listingUrl, {
        width: 216, // renders at 3× (72px display → 216px logical = crisp at 3× pixelRatio)
        margin: 1,
        color: { dark: "#111827", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });

      // 2. Convert the listing image to base64 (prevents html-to-image CORS canvas taint)
      let imageDataUrl: string | undefined;
      if (listing.imageUrl) {
        try {
          imageDataUrl = await urlToDataUrl(listing.imageUrl);
        } catch {
          // Non-fatal — card renders without image
          imageDataUrl = undefined;
        }
      }

      // 3. Convert the Njimbong logo to base64 so html-to-image can embed it
      let logoDataUrl: string | undefined;
      try {
        logoDataUrl = await urlToDataUrl("/logo.svg");
      } catch {
        logoDataUrl = undefined;
      }

      setCardData({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        condition: listing.condition,
        city: listing.city,
        country: listing.country,
        category: listing.category,
        imageDataUrl,
        logoDataUrl,
        listingUrl,
        qrDataUrl,
      });
    } catch {
      setPrepError(true);
    }
  }, [isOpen, listing]);

  useEffect(() => {
    prepare();
  }, [prepare]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCardData(null);
      setIsDownloading(false);
      setDownloadDone(false);
      setPrepError(false);
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 3, // 360×3 = 1080px  |  640×3 = 1920px
        cacheBust: true,
        backgroundColor: undefined, // card has its own background
      });
      if (!blob) throw new Error("toBlob returned null");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `njimbong-listing-${listing.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadDone(true);
    } catch (err) {
      console.error("[ShareCard] Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              Your listing is live!
            </h2>
            <p className="text-emerald-100 text-sm mt-0.5">
              Share to your WhatsApp Story to reach more buyers
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors ml-3 flex-shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
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

        {/* ── Body ── */}
        <div className="p-5">
          {/* Card preview area */}
          <div
            className="rounded-xl overflow-hidden mb-5 relative"
            style={{
              background: "#0b1e10",
              /* Show the 360×640 card at ~65% scale to fit inside the modal.
                 The actual rendered element stays at 360×640 so html-to-image
                 captures full resolution. We shrink the *container* height to
                 match the scaled visual height: 640 × 0.65 ≈ 416px */
              height: 416,
            }}
          >
            {!cardData && !prepError && (
              /* Loading skeleton */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-emerald-300 text-sm">
                  Generating your share card…
                </span>
              </div>
            )}

            {prepError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="text-4xl">⚠️</span>
                <p className="text-white/60 text-sm">
                  Could not generate the share card. You can still view your
                  listing from the dashboard.
                </p>
              </div>
            )}

            {cardData && (
              /* Scale the 360×640 card to fit in the 416px tall container.
                 Scale factor: 416/640 ≈ 0.65
                 Horizontal: at 0.65, width = 360×0.65 = 234px — centre it. */
              <div
                style={{
                  transformOrigin: "top left",
                  transform: "scale(0.65) translateX(-50%)",
                  position: "relative",
                  left: "50%",
                  width: 360,
                  flexShrink: 0,
                }}
              >
                <ListingShareCard data={cardData} cardRef={cardRef} />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={!cardData || isDownloading || prepError}
              className={[
                "w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-semibold text-base transition-all",
                !cardData || isDownloading || prepError
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : downloadDone
                    ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98]",
              ].join(" ")}
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating image…
                </>
              ) : downloadDone ? (
                <>
                  <svg
                    className="w-5 h-5"
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
                  Saved to your device!
                </>
              ) : (
                <>
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
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                    />
                  </svg>
                  Download Story Image (1080×1920)
                </>
              )}
            </button>

            {/* How to share hint */}
            {downloadDone && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Open WhatsApp, tap <strong>Status → My status → Image</strong>
                  , then select the downloaded image. Buyers can scan the QR
                  code directly from your story!
                </p>
              </div>
            )}

            {/* Skip */}
            <button
              onClick={onClose}
              className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              {downloadDone ? "Done — close" : "Skip for now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
