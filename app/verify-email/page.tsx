"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const RESEND_COOLDOWN = 60; // seconds

type VerifyState = "loading" | "success" | "error" | "idle";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Token-mode state
  const [verifyState, setVerifyState] = useState<VerifyState>(
    token ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Resend state (email mode)
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [resendError, setResendError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-verify when token is present
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await axios.get(`${API_BASE}/api/auth/verify-email`, {
          params: { token },
        });
        setVerifyState("success");
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          "This verification link is invalid or has expired.";
        setErrorMessage(msg);
        setVerifyState("error");
      }
    };

    verify();
  }, [token]);

  // Cooldown timer management
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resendStatus === "sending") return;
    setResendStatus("sending");
    setResendError("");
    try {
      await axios.post(`${API_BASE}/api/auth/resend-verification`, { email });
      setResendStatus("sent");
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => setResendStatus("idle"), 5000);
    } catch (err: any) {
      const retryAfter = err.response?.data?.retryAfter;
      if (retryAfter) {
        setCooldown(retryAfter);
        setResendStatus("idle");
      } else {
        setResendError(
          err.response?.data?.error || "Failed to resend. Please try again.",
        );
        setResendStatus("error");
        setTimeout(() => {
          setResendStatus("idle");
          setResendError("");
        }, 5000);
      }
    }
  };

  // ─── Token mode ───────────────────────────────────────────────────────────
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          {verifyState === "loading" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Verifying your email
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Please wait a moment...
              </p>
            </>
          )}

          {verifyState === "success" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Email verified!
              </h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Your account is now active. You can sign in and start using
                Njimbong.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center justify-center w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-6 transition-colors duration-150"
              >
                Continue to Login
              </Link>
            </>
          )}

          {verifyState === "error" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Verification failed
              </h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {errorMessage}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-3 px-6 transition-colors duration-150"
                >
                  Back to Signup
                </Link>
                <Link
                  href="/login"
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 transition-colors duration-150"
                >
                  Try Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Email mode (check-inbox UI) ─────────────────────────────────────────
  const maskedEmail = email
    ? email.replace(
        /(.{2})(.*)(@.*)/,
        (_, a, b, c) => a + "*".repeat(b.length) + c,
      )
    : "your inbox";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          {/* Envelope illustration */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Check your inbox
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We sent a verification link to{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {maskedEmail}
            </span>
            . Click the link in the email to activate your account.
          </p>

          {/* Steps hint */}
          <div className="mt-6 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 text-left space-y-2">
            {[
              "Open the email from Njimbong",
              'Click "Verify my email"',
              "You'll be redirected and signed in",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Resend section */}
          <div className="mt-8">
            {resendStatus === "sent" ? (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Email sent — check your inbox again.
              </div>
            ) : resendStatus === "error" ? (
              <p className="text-sm text-red-500">{resendError}</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Didn&apos;t receive anything? Check your spam folder or
                </p>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resendStatus === "sending"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendStatus === "sending" ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    "Resend verification email"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Divider + login link */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Already verified?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Spam note */}
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500 px-4">
          The email may take a minute to arrive. Be sure to check your spam or
          junk folder.
        </p>
      </div>
    </div>
  );
}
