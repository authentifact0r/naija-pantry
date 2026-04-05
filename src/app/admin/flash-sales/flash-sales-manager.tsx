"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Clock, Plus, Trash2, ChevronDown, ChevronRight,
  Image as ImageIcon, CheckCircle, AlertTriangle, Pause, Play,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Props {
  sales: any[];
  products: any[];
  tenantSlug: string;
}

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${mins}m left`;
}

export function FlashSalesManager({ sales, products, tenantSlug }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [discount, setDiscount] = useState(20);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(24);

  const activeSales = sales.filter(s => s.isActive && new Date(s.endsAt) > new Date());
  const expiredSales = sales.filter(s => !s.isActive || new Date(s.endsAt) <= new Date());

  // Products not already in a flash sale
  const availableProducts = products.filter(p => !sales.some(s => s.productId === p.id));

  const createSale = async () => {
    if (!selectedProduct || discount <= 0 || discount > 99) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/flash-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct, discountPercent: discount, reason, durationHours: duration }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Failed"); setSaving(false); return; }
      setShowCreate(false); setSelectedProduct(""); setDiscount(20); setReason(""); setDuration(24);
      setSaving(false);
      router.refresh();
    } catch { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch("/api/admin/flash-sales/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    });
    router.refresh();
  };

  const deleteSale = async (id: string) => {
    if (!confirm("Remove this flash sale?")) return;
    await fetch("/api/admin/flash-sales/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-400" /> Flash Sales
          </h1>
          <p className="text-sm text-white/40 mt-1">{activeSales.length} active · {expiredSales.length} expired</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition">
          <Plus className="h-3.5 w-3.5" /> Create Flash Sale
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">New Flash Sale</h2>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Product</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white focus:outline-none">
              <option value="" className="bg-gray-900">Select a product...</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id} className="bg-gray-900">{p.name} — {formatPrice(p.price)}</option>
              ))}
            </select>
            {availableProducts.length === 0 && <p className="text-xs text-amber-400 mt-1">All products already have flash sales.</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Discount %</label>
              <input type="number" min="1" max="99" value={discount} onChange={e => setDiscount(parseInt(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Duration (hours)</label>
              <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white focus:outline-none">
                <option value="6" className="bg-gray-900">6 hours</option>
                <option value="12" className="bg-gray-900">12 hours</option>
                <option value="24" className="bg-gray-900">24 hours</option>
                <option value="48" className="bg-gray-900">48 hours</option>
                <option value="72" className="bg-gray-900">72 hours (3 days)</option>
                <option value="168" className="bg-gray-900">168 hours (1 week)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Reason / Label</label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Weekend Flash" className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none" />
            </div>
          </div>

          {selectedProduct && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm text-white">{products.find(p => p.id === selectedProduct)?.name}</p>
                <p className="text-xs text-white/40">
                  Was {formatPrice(products.find(p => p.id === selectedProduct)?.price || 0)} →{" "}
                  <span className="text-amber-400 font-semibold">
                    {formatPrice((products.find(p => p.id === selectedProduct)?.price || 0) * (1 - discount / 100))}
                  </span>{" "}
                  ({discount}% off for {duration}h)
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={createSale} disabled={saving || !selectedProduct} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold transition">
              <Zap className="h-4 w-4" /> {saving ? "Creating..." : "Launch Flash Sale"}
            </button>
            <button onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-lg bg-white/[0.06] text-white/50 text-sm hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Active Sales */}
      {activeSales.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Active Sales</h2>
          {activeSales.map(sale => {
            const isOpen = expanded === sale.id;
            const salePrice = sale.product.price * (1 - sale.discountPercent / 100);
            const remaining = timeLeft(sale.endsAt);

            return (
              <div key={sale.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : sale.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
                  {sale.product.images?.[0] ? (
                    <img src={sale.product.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-white/[0.06] flex items-center justify-center"><ImageIcon className="h-5 w-5 text-white/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{sale.product.name}</p>
                    <p className="text-xs text-white/30">{sale.reason || "Flash Sale"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/40 line-through">{formatPrice(sale.product.price)}</p>
                    <p className="text-sm font-bold text-amber-400">{formatPrice(salePrice)}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-400">{sale.discountPercent}% off</span>
                  <span className="hidden sm:flex items-center gap-1 text-xs text-white/40"><Clock className="h-3 w-3" /> {remaining}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-white/30" /> : <ChevronRight className="h-4 w-4 text-white/30" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.04] bg-white/[0.01] p-5 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-xs text-white/40">Original</span><p className="text-white font-medium">{formatPrice(sale.product.price)}</p></div>
                      <div><span className="text-xs text-white/40">Sale Price</span><p className="text-amber-400 font-bold">{formatPrice(salePrice)}</p></div>
                      <div><span className="text-xs text-white/40">Started</span><p className="text-white/60">{new Date(sale.startsAt).toLocaleString("en-GB")}</p></div>
                      <div><span className="text-xs text-white/40">Ends</span><p className="text-white/60">{new Date(sale.endsAt).toLocaleString("en-GB")}</p></div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
                      <button onClick={() => toggleActive(sale.id, sale.isActive)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.1] transition">
                        {sale.isActive ? <><Pause className="h-3.5 w-3.5" /> Pause Sale</> : <><Play className="h-3.5 w-3.5" /> Resume Sale</>}
                      </button>
                      <button onClick={() => deleteSale(sale.id)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Expired / Inactive */}
      {expiredSales.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/30">Expired / Paused</h2>
          {expiredSales.map(sale => (
            <div key={sale.id} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 opacity-60">
              {sale.product.images?.[0] ? (
                <img src={sale.product.images[0]} alt="" className="h-9 w-9 rounded-lg object-cover grayscale" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center"><ImageIcon className="h-4 w-4 text-white/20" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/60 truncate">{sale.product.name}</p>
                <p className="text-xs text-white/30">{sale.discountPercent}% off · {sale.reason || "Flash Sale"}</p>
              </div>
              <button onClick={() => deleteSale(sale.id)} className="text-xs text-white/30 hover:text-red-400 transition">Remove</button>
            </div>
          ))}
        </div>
      )}

      {sales.length === 0 && !showCreate && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
          <Zap className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No flash sales yet.</p>
          <p className="text-xs text-white/30 mt-1">Create a time-limited discount to boost sales.</p>
        </div>
      )}
    </div>
  );
}
