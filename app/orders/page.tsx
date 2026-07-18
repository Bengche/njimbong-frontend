"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Axios from "axios";
import PageHeader from "../components/PageHeader";
import LoadingArt from "../components/LoadingArt";
import DisputeModal from "../components/DisputeModal";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "buying" | "selling">("all");
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [releaseError, setReleaseError] = useState("");

  useEffect(() => {
    fetchOrders();
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
      // Refresh orders
      fetchOrders();
    } catch (err) {
      const msg = Axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;
      setReleaseError(msg || "Failed to release payment.");
    } finally {
      setReleasingId(null);
    }
  };

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
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Order History"
        description="Track all your purchases and sales"
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <svg
              className="w-5 h-5"
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
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {releaseError}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-500 text-sm">
            {tab === "buying"
              ? "You have not made any purchases yet."
              : tab === "selling"
                ? "You have not received any orders yet."
                : "No orders found. Start buying or selling to see your order history here."}
          </p>
          <button
            onClick={() => router.push("/market")}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition text-sm"
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="flex gap-4 p-4">
                  {/* Listing image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
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
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {order.listing_title || "Listing"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Order #{order.order_reference}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="font-bold text-green-600">
                        {Number(order.amount).toLocaleString()} {order.currency}
                      </span>
                      <span className="text-gray-500">
                        {order.my_role === "buyer"
                          ? `Seller: ${order.seller_name}`
                          : `Buyer: ${order.buyer_name}`}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
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
                  <div className="px-4 pb-4 flex gap-2 flex-wrap">
                    {canRelease && (
                      <button
                        onClick={() => releasePayment(order.id)}
                        disabled={releasingId === order.id}
                        className="flex-1 min-w-[120px] py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {releasingId === order.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {releasingId === order.id
                          ? "Releasing..."
                          : "Confirm Receipt & Release"}
                      </button>
                    )}
                    {canDispute && (
                      <button
                        onClick={() => setDisputeOrder(order)}
                        className="flex-1 min-w-[120px] py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1.5"
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        File Dispute
                      </button>
                    )}
                    {order.listing_id && (
                      <button
                        onClick={() =>
                          router.push(`/listing/${order.listing_id}`)
                        }
                        className="py-2 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                      >
                        View Listing
                      </button>
                    )}
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
  );
}
