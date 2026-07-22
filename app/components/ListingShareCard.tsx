"use client";
/**
 * ListingShareCard
 * Renders a 9:16 (360×640) branded card designed for WhatsApp Stories / Instagram Stories.
 * Must be rendered with an explicit width/height so html-to-image captures it correctly.
 * Use `pixelRatio: 3` on capture → 1080×1920 output.
 */

import React from "react";

export interface ShareCardData {
  id: number;
  title: string;
  price: string | number;
  currency: string;
  condition?: string;
  city?: string;
  country?: string;
  category?: string;
  imageDataUrl?: string; // base64 data URL of the first listing image
  listingUrl: string;
  qrDataUrl?: string; // base64 data URL of the QR code PNG
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: string | number, currency: string): string {
  const n = Number(price);
  if (isNaN(n)) return String(price);
  return n.toLocaleString("en-US") + " " + currency;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Card ──────────────────────────────────────────────────────────────────────

export default function ListingShareCard({
  data,
  cardRef,
}: {
  data: ShareCardData;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { title, price, currency, condition, city, country, imageDataUrl, qrDataUrl, category } = data;
  const location = [city, country].filter(Boolean).join(", ");
  const priceLabel = formatPrice(price, currency);

  return (
    <div
      ref={cardRef}
      style={{
        width: 360,
        height: 640,
        position: "relative",
        overflow: "hidden",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: "linear-gradient(160deg, #071a0e 0%, #0b3320 45%, #052e16 100%)",
        flexShrink: 0,
      }}
    >
      {/* ── Decorative background circles ── */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(22,163,74,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: -80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(4,120,87,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Top brand header ── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        {/* Logo pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: 40,
            padding: "6px 14px 6px 6px",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: "#16a34a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              flexShrink: 0,
            }}
          >
            N
          </div>
          <span
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.3px",
            }}
          >
            Njimbong
          </span>
        </div>

        {/* "For Sale" pill */}
        <div
          style={{
            background: "#16a34a",
            color: "#ffffff",
            borderRadius: 40,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          For Sale
        </div>
      </div>

      {/* ── Product image ── */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 16,
          right: 16,
          height: 288,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {imageDataUrl ? (
          <img
            src={imageDataUrl}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          /* Placeholder when no image */
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #134e2a 0%, #166534 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              📦
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              No image
            </span>
          </div>
        )}
        {/* Gradient overlay at bottom of image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(5,30,12,0.6) 0%, transparent 50%)",
          }}
        />
        {/* Condition badge over image */}
        {condition && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 30,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: "#ffffff",
              textTransform: "capitalize",
            }}
          >
            {condition}
          </div>
        )}
        {/* Category badge */}
        {category && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 14,
              background: "rgba(22,163,74,0.85)",
              backdropFilter: "blur(8px)",
              borderRadius: 30,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            {category}
          </div>
        )}
      </div>

      {/* ── Product info section ── */}
      <div
        style={{
          position: "absolute",
          top: 372,
          left: 20,
          right: 20,
        }}
      >
        {/* Price */}
        <div
          style={{
            display: "inline-block",
            background: "linear-gradient(90deg, #16a34a, #059669)",
            borderRadius: 10,
            padding: "6px 16px",
            fontSize: 20,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.5px",
            marginBottom: 10,
            boxShadow: "0 2px 12px rgba(22,163,74,0.35)",
          }}
        >
          {priceLabel}
        </div>

        {/* Title */}
        <div
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: 8,
            letterSpacing: "-0.4px",
          }}
        >
          {truncate(title, 60)}
        </div>

        {/* Location */}
        {location && (
          <div
            style={{
              color: "#86efac",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 13 }}>📍</span>
            {location}
          </div>
        )}
      </div>

      {/* ── QR + CTA bottom panel ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "16px 20px 20px",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* QR code */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code"
                style={{ width: 72, height: 72, display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "#e5e7eb",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ▦
              </div>
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.25,
                marginBottom: 4,
              }}
            >
              Scan to view & buy
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              Secure escrow payments. Trusted by thousands across Cameroon.
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: "#16a34a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 900,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                N
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#16a34a",
                }}
              >
                njimbong.com
              </span>
            </div>
          </div>
        </div>

        {/* Trust line */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {["Verified Sellers", "Escrow Protected", "Fast Delivery"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    background: "#16a34a",
                    borderRadius: "50%",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {label}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
