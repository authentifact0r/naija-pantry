"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Truck, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, User, MapPin, CreditCard,
  Save, Image as ImageIcon, AlertTriangle, Plus,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string; icon: any; next?: string }> = {
  PENDING: { color: "bg-amber-500/15 text-amber-400", icon: Clock, next: "CONFIRMED" },
  CONFIRMED: { color: "bg-blue-500/15 text-blue-400", icon: CheckCircle, next: "PROCESSING" },
  PROCESSING: { color: "bg-violet-500/15 text-violet-400", icon: Package, next: "SHIPPED" },
  SHIPPED: { color: "bg-cyan-500/15 text-cyan-400", icon: Truck, next: "DELIVERED" },
  DELIVERED: { color: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle },
  CANCELLED: { color: "bg-red-500/15 text-red-400", icon: XCircle },
};

interface Props {
  orders: any[];
  products: any[];
  tenantSlug: string;
}

export function OrdersManager({ orders, products, tenantSlug }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");

  const pending = orders.filter(o => o.status === "PENDING").length;
  const processing = orders.filter(o => ["CONFIRMED", "PROCESSING"].includes(o.status)).length;
  const totalRevenue = orders.filter(o => o.paymentStatus === "PAID").reduce((s, o) => s + o.total, 0);

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setSaving(orderId);
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus, trackingNumber: trackingInput[orderId] || null, notes: notesInput[orderId] || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Update failed: " + (err.error || "Unknown error"));
        setSaving(null);
        return;
      }
      // Refresh server data (re-runs the server component)
      router.refresh();
      setSaving(null);
      setExpanded(null);
    } catch (err) {
      alert("Network error. Please try again.");
      setSaving(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    await updateStatus(orderId, "CANCELLED");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-400" /> Orders
          </h1>
          <p className="text-sm text-white/40 mt-1">{orders.length} total · {formatPrice(totalRevenue)} revenue</p>
        </div>
        <div className="flex gap-2">
          {pending > 0 && <span className="rounded-xl bg-amber-500/[0.08] border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400">{pending} pending</span>}
          {processing > 0 && <span className="rounded-xl bg-violet-500/[0.08] border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-400">{processing} processing</span>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Revenue", value: formatPrice(totalRevenue), icon: CreditCard, color: "text-emerald-400" },
          { label: "Pending", value: pending, icon: Clock, color: pending > 0 ? "text-amber-400" : "text-white/40" },
          { label: "In Progress", value: processing, icon: Package, color: processing > 0 ? "text-violet-400" : "text-white/40" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${statusFilter === s ? "bg-white/[0.1] text-white" : "bg-white/[0.04] text-white/40 hover:text-white/60"}`}>
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No orders found.</p>
          </div>
        ) : filtered.map(order => {
          const isOpen = expanded === order.id;
          const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
          const Icon = config.icon;

          return (
            <div key={order.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
              {/* Order Row */}
              <button onClick={() => setExpanded(isOpen ? null : order.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{order.orderNumber}</p>
                  <p className="text-xs text-white/30">{new Date(order.createdAt).toLocaleDateString("en-GB")} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-white font-semibold tabular-nums">{formatPrice(order.total)}</span>
                <span className="hidden sm:inline rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">{order.shippingMethod}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.color}`}>
                  <Icon className="h-3 w-3" /> {order.status}
                </span>
                {isOpen ? <ChevronDown className="h-4 w-4 text-white/30" /> : <ChevronRight className="h-4 w-4 text-white/30" />}
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className="border-t border-white/[0.04] bg-white/[0.01] p-5 space-y-5">
                  {/* Items */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Items</h3>
                    <div className="space-y-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 py-2">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center"><ImageIcon className="h-4 w-4 text-white/20" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.product?.name}</p>
                            <p className="text-xs text-white/30">{item.product?.sku} · Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium text-white tabular-nums">{formatPrice(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-3 mt-3 border-t border-white/[0.04] text-sm">
                      <span className="text-white/40">Subtotal</span><span className="text-white tabular-nums">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Shipping ({order.shippingMethod})</span><span className="text-white tabular-nums">{formatPrice(order.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-white/[0.04] text-sm font-semibold">
                      <span className="text-white">Total</span><span className="text-emerald-400 tabular-nums">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  {/* Customer + Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1"><User className="h-3 w-3" /> Customer</h3>
                      <p className="text-sm text-white">{order.user?.firstName} {order.user?.lastName}</p>
                      <p className="text-xs text-white/40">{order.user?.email}</p>
                      {order.user?.phone && <p className="text-xs text-white/40">{order.user.phone}</p>}
                    </div>
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery Address</h3>
                      <p className="text-sm text-white">{order.address?.line1}</p>
                      {order.address?.line2 && <p className="text-xs text-white/50">{order.address.line2}</p>}
                      <p className="text-xs text-white/40">{order.address?.city}, {order.address?.postcode}</p>
                    </div>
                  </div>

                  {/* Tracking + Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1">Tracking Number</label>
                      <input
                        value={trackingInput[order.id] ?? order.trackingNumber ?? ""}
                        onChange={e => setTrackingInput(p => ({ ...p, [order.id]: e.target.value }))}
                        placeholder="e.g. RM123456789GB"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1">Internal Notes</label>
                      <input
                        value={notesInput[order.id] ?? order.notes ?? ""}
                        onChange={e => setNotesInput(p => ({ ...p, [order.id]: e.target.value }))}
                        placeholder="Add a note..."
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                      />
                    </div>
                  </div>

                  {/* Payment info */}
                  <div className="flex flex-wrap gap-3 text-xs text-white/40">
                    <span>Payment: <strong className={order.paymentStatus === "PAID" ? "text-emerald-400" : "text-amber-400"}>{order.paymentStatus}</strong></span>
                    <span>Provider: {order.paymentProvider}</span>
                    {order.paymentRef && <span>Ref: {order.paymentRef}</span>}
                    <span>Weight: {order.totalWeightKg.toFixed(2)}kg</span>
                    {order.warehouse?.name && <span>Warehouse: {order.warehouse.name}</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
                    {config.next && (
                      <button
                        onClick={() => updateStatus(order.id, config.next!)}
                        disabled={saving === order.id}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                      >
                        {saving === order.id ? "Updating..." : `Mark as ${config.next.charAt(0) + config.next.slice(1).toLowerCase()}`}
                      </button>
                    )}
                    {(trackingInput[order.id] !== undefined || notesInput[order.id] !== undefined) && (
                      <button
                        onClick={() => updateStatus(order.id, order.status)}
                        disabled={saving === order.id}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.1] transition"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Details
                      </button>
                    )}
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
