"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Axios from "axios";
import PageHeader from "../components/PageHeader";
import LoadingArt from "../components/LoadingArt";
import DisputeModal from "../components/DisputeModal";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const REDIRECT_SECS = 6;

interface Order {
  id: number;
  order_reference: string;
  amount: number;
  currency: string;
  fonlok_status: string;
  created_at: string;
  buyer_id: number;
  seller_id: number;
  listing_id: number;
  listing_title: string;
  listing_image: string | null;
  listing_city: string;
  listing_country: string;
  buyer_name: string;
  seller_name: string;
  my_role: "buyer" | "seller";
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: {
    label: "Payment Pending",
    classes: "bg-yellow-100 text-yellow-700",
  },
  paid_in_escrow: {
    label: "Funds in Escrow",
    classes: "bg-blue-100 text-blue-700",
  },
  released: { label: "Completed", classes: "bg-green-100 text-green-700" },
  disputed: { label: "Under Dispute", classes: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-600" },
  failed: { label: "Payment Failed", classes: "bg-red-100 text-red-600" },
  initiation_failed: { label: "Failed", classes: "bg-red-100 text-red-600" },
};

// ─── Confirm Release Warning Modal ──────────────────────────────────────────
function ConfirmReleaseModal({
  order,
  onCancel,
  onConfirm,
  releasing,
}: {
  order: Order;
  onCancel: () => void;
  onConfirm: () => void;
  releasing: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={!releasing ? onCancel : undefined}
      />
      <div
        className={`relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-[28px] shadow-2xl transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Amber accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500 sm:rounded-t-2xl" />
        <div className="px-5 pt-4 pb-6 sm:px-6 sm:py-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                Confirm Delivery &amp; Release Funds
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {order.listing_title || "Your Order"} &mdash;{" "}
                {Number(order.amount).toLocaleString()} {order.currency}
              </p>
            </div>
          </div>
          {/* Irreversibility warning */}
          <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-amber-800 text-xs leading-relaxed">
              <strong className="font-bold">This action is permanent and cannot be undone.</strong>{" "}
              Once confirmed, the payment will be instantly released to the seller and cannot be reversed.
            </p>
          </div>
          {/* Checklist */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Before confirming, ensure:
          </p>
          <ul className="space-y-2.5 mb-6">
            {[
              "You have physically received the item",
              "The item matches the listing description exactly",
              "The condition of the item is as agreed",
              "You are fully satisfied with this transaction",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <button
              onClick={onCancel}
              disabled={releasing}
              className="flex-1 py-3 sm:py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              Go Back
            </button>
            <button
              onClick={onConfirm}
              disabled={releasing}
              className="flex-1 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-green-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200/60 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {releasing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Yes, Release Funds
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Release Success Overlay ─────────────────────────────────────────────────
function ReleaseSuccessOverlay({
  order,
  onDone,
}: {
  order: Order;
  onDone: () => void;
}) {
  const [countdown, setCountdown] = useState(REDIRECT_SECS);
  const [checkVisible, setCheckVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCheckVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onDone]);

  const progress = Math.round(((REDIRECT_SECS - countdown) / REDIRECT_SECS) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-900">
      <div className="w-full max-w-xs text-center select-none">
        {/* Animated ring + checkmark */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-32 h-32 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: "1.8s" }} />
          <div className="absolute w-24 h-24 rounded-full bg-emerald-400/15" />
          <div
            className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl shadow-black/40 flex items-center justify-center transition-all duration-500 ease-out ${
              checkVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <svg
              className={`w-10 h-10 text-white transition-opacity duration-300 delay-300 ${checkVisible ? "opacity-100" : "opacity-0"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Payment Released!</h1>
        <p className="text-emerald-200 text-sm mb-1">
          <strong className="text-emerald-300 font-semibold">
            {Number(order.amount).toLocaleString()} {order.currency}
          </strong>{" "}
          has been released to {order.seller_name}.
        </p>
        <p className="text-emerald-400/70 text-xs mb-8 leading-relaxed">
          Your transaction is complete. Thank you for using<br />
          Njimbong&apos;s secure escrow service.
        </p>
        {/* Countdown bar */}
        <div className="bg-white/10 rounded-full h-1 mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-emerald-500 text-xs mb-7 tabular-nums">
          Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}
        </p>
        <button
          onClick={onDone}
          className="inline-flex items-center gap-2 px-7 py-3 bg-white/10 hover:bg-white/[0.15] border border-white/20 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95"
        >
          Go to Orders
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "buying" | "selling">("all");
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await Axios.get(`${API_BASE}/api/orders`);
      setOrders(res.data.orders || []);
    } catch (err) {
      if (Axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/login?redirect=/orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const releasePayment = async (orderId: number) => {
    setReleasingId(orderId);
    setReleaseError("");
    try {
      await Axios.post(`${API_BASE}/api/payments/release`, {
        order_id: orderId,
      });
      const released = confirmOrder;
      setConfirmOrder(null);
      await fetchOrders();
      if (released) setSuccessOrder(released);
    } catch (err) {
      const msg = Axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;
      setReleaseError(msg || "Failed to release payment.");
      setConfirmOrder(null);
    } finally {
      setReleasingId(null);
    }
  };

  const handleDoneSuccess = useCallback(() => {
    setSuccessOrder(null);
    router.push("/orders");
  }, [router]);

  const filteredOrders = orders.filter((o) => {
    if (tab === "buying") return o.my_role === "buyer";
    if (tab === "selling") return o.my_role === "seller";
    return true;
  });

  if (loading) {
    return (
      <LoadingArt
        fullScreen
        label="Loading orders"
        subLabel="Fetching your order history"
      />
    );
  }

  return (
    <>
      {confirmOrder && (
        <ConfirmReleaseModal
          order={confirmOrder}
          onCancel={() => !releasingId && setConfirmOrder(null)}
          onConfirm={() => releasePayment(confirmOrder.id)}
          releasing={releasingId === confirmOrder.id}
        />
      )}
      {successOrder && (
        <ReleaseSuccessOverlay order={successOrder} onDone={handleDoneSuccess} />
      )}
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Order History"
        description="Track all your purchases and sales"
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {(["all", "buying", "selling"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "all"
              ? "All Orders"
              : t === "buying"
                ? "Purchases"
                : "Sales"}
          </button>
        ))}
      </div>

      {releaseError && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {releaseError}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No orders yet
          </h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            {tab === "buying"
              ? "You have not made any purchases yet."
              : tab === "selling"
                ? "You have not received any orders yet."
              : "No orders found. Start buying or selling to see your history here."}
          </p>
          <button
            onClick={() => router.push("/market")}
            className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition text-sm"
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((order) => {
            const status = STATUS_CONFIG[order.fonlok_status] ?? {
              label: order.fonlok_status,
              classes: "bg-gray-100 text-gray-600",
            };
            const canRelease =
              order.my_role === "buyer" &&
              order.fonlok_status === "paid_in_escrow";
            const canDispute =
              (order.my_role === "buyer" || order.my_role === "seller") &&
              order.fonlok_status === "paid_in_escrow";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Per-status accent stripe */}
                {order.fonlok_status === "paid_in_escrow" && (
                  <div className="h-0.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400" />
                )}
                {order.fonlok_status === "released" && (
                  <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-green-500" />
                )}
                <div className="flex gap-3 sm:gap-4 p-4">
                  {/* Listing image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {order.listing_image ? (
                      <Image
                        src={order.listing_image}
                        alt={order.listing_title || ""}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
                          {order.listing_title || "Listing"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ref: {order.order_reference}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full leading-5 ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-black text-emerald-600 text-lg leading-none">
                        {Number(order.amount).toLocaleString()}
                        <span className="text-xs font-bold ml-1 text-emerald-500">{order.currency}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {order.my_role === "buyer"
                          ? `Seller: ${order.seller_name}`
                          : `Buyer: ${order.buyer_name}`}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {order.listing_city &&
                        ` · ${order.listing_city}, ${order.listing_country}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {(canRelease || canDispute) && (
                  <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
                    {canRelease && (
                      <button
                        onClick={() => setConfirmOrder(order)}
                        className="w-full sm:flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-green-700 active:scale-[0.99] transition-all shadow-md shadow-emerald-200/50 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Confirm Delivery &amp; Release Funds
                      </button>
                    )}
                    <div className="flex gap-2">
                      {canDispute && (
                        <button
                          onClick={() => setDisputeOrder(order)}
                          className={`${
                            canRelease ? "flex-1 sm:flex-initial sm:w-auto" : "flex-1"
                          } py-2.5 px-4 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          File Dispute
                        </button>
                      )}
                      {order.listing_id && (
                        <button
                          onClick={() => router.push(`/listing/${order.listing_id}`)}
                          className="py-2.5 px-4 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.99] transition-all flex items-center justify-center"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Modal */}
      {disputeOrder && (
        <DisputeModal
          isOpen={true}
          onClose={() => setDisputeOrder(null)}
          orderId={disputeOrder.id}
          orderReference={disputeOrder.order_reference}
          listingTitle={disputeOrder.listing_title || ""}
          myRole={disputeOrder.my_role}
          onDisputeFiled={() => {
            setDisputeOrder(null);
            fetchOrders();
          }}
        />
      )}
    </main>
    </>
  );
}
