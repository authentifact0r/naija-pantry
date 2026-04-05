"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Plus, X, Eye, EyeOff, Search, Tag, Info } from "lucide-react";

const CATEGORIES = ["GROCERIES", "SPICES", "DRINKS", "BEAUTY", "FASHION", "ACCESSORIES", "HOME", "OTHER"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export function EditProductForm({ product }: { product: any }) {
  const router = useRouter();
  const sp = useSearchParams();
  const tp = sp.get("tenant") ? `?tenant=${sp.get("tenant")}` : "";
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(product.images || []);
  const [newImage, setNewImage] = useState("");
  const [isActive, setIsActive] = useState(product.isActive);
  const [tags, setTags] = useState<string[]>(product.tags || []);
  const [newTag, setNewTag] = useState("");
  const [sizes, setSizes] = useState<string[]>(product.sizes || []);
  const [colors, setColors] = useState<string[]>(product.colors || []);
  const [newColor, setNewColor] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>(product.seoKeywords || []);
  const [newKeyword, setNewKeyword] = useState("");

  const addImage = () => { if (newImage.trim()) { setImages(p => [...p, newImage.trim()]); setNewImage(""); } };
  const addTag = () => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags(p => [...p, newTag.trim()]); setNewTag(""); } };
  const addColor = () => { if (newColor.trim() && !colors.includes(newColor.trim())) { setColors(p => [...p, newColor.trim()]); setNewColor(""); } };
  const addKeyword = () => { if (newKeyword.trim() && !seoKeywords.includes(newKeyword.trim())) { setSeoKeywords(p => [...p, newKeyword.trim()]); setNewKeyword(""); } };
  const toggleSize = (s: string) => setSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      shortDescription: form.get("shortDescription") || null,
      category: form.get("category"),
      price: parseFloat(form.get("price") as string),
      compareAtPrice: form.get("compareAtPrice") ? parseFloat(form.get("compareAtPrice") as string) : null,
      material: form.get("material") || null,
      careInstructions: form.get("careInstructions") || null,
      brand: form.get("brand") || null,
      metaTitle: form.get("metaTitle") || null,
      metaDescription: form.get("metaDescription") || null,
      tags, images, sizes, colors, seoKeywords, isActive,
    };
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      router.push("/admin/products" + tp);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product permanently?")) return;
    setDeleting(true);
    try { await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" }); router.push("/admin/products" + tp); } catch { setDeleting(false); }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Link href={`/admin/products${tp}`} className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{product.name}</h1>
          <p className="text-sm text-white/40 mt-1">SKU: {product.sku} · Stock: {product.totalStock}</p>
        </div>
        <button onClick={() => setIsActive(!isActive)} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40"}`}>
          {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {isActive ? "Live" : "Draft"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Info className="h-4 w-4" /> Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-white/80 mb-2">Product Name</label><input name="name" defaultValue={product.name} required className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-white/80 mb-2">Tagline <span className="text-white/30">(short, for cards & social)</span></label><input name="shortDescription" defaultValue={product.shortDescription || ""} placeholder="e.g. The ultimate winter essential" className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-white/80 mb-2">Full Description</label><textarea name="description" defaultValue={product.description} required rows={4} className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition resize-none" /></div>
            <div><label className="block text-sm font-medium text-white/80 mb-2">Category</label><select name="category" defaultValue={product.category} className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition">{CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-white/80 mb-2">Brand</label><input name="brand" defaultValue={product.brand || ""} placeholder="Styled by Maryam" className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
          </div>
        </section>

        {/* Pricing */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-white/80 mb-2">Price (£)</label><input name="price" type="number" step="0.01" defaultValue={product.price} required className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
            <div><label className="block text-sm font-medium text-white/80 mb-2">Compare at Price</label><input name="compareAtPrice" type="number" step="0.01" defaultValue={product.compareAtPrice || ""} className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
          </div>
        </section>

        {/* Variants */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Variants & Details</h2>
          <div><label className="block text-sm font-medium text-white/80 mb-2">Material</label><input name="material" defaultValue={product.material || ""} placeholder="e.g. 100% Cashmere" className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
          <div><label className="block text-sm font-medium text-white/80 mb-2">Care Instructions</label><input name="careInstructions" defaultValue={product.careInstructions || ""} placeholder="e.g. Dry clean only" className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
          <div><label className="block text-sm font-medium text-white/80 mb-2">Sizes</label><div className="flex flex-wrap gap-2">{SIZE_OPTIONS.map(s => (<button key={s} type="button" onClick={() => toggleSize(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${sizes.includes(s) ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.06] text-white/40 border border-white/[0.08]"}`}>{s}</button>))}</div></div>
          <div><label className="block text-sm font-medium text-white/80 mb-2">Colors</label><div className="flex flex-wrap gap-2 mb-2">{colors.map((c, i) => (<span key={i} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/60">{c} <button type="button" onClick={() => setColors(p => p.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-red-400"><X className="h-3 w-3" /></button></span>))}</div><div className="flex gap-2"><input value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addColor())} placeholder="Add color..." className="flex-1 h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none" /><button type="button" onClick={addColor} className="h-9 px-3 rounded-lg bg-white/[0.06] text-white/40 hover:text-white/60 transition"><Plus className="h-4 w-4" /></button></div></div>
        </section>

        {/* Images */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Images</h2>
          <div className="flex gap-2"><input value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="Paste image URL..." className="flex-1 h-10 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none" /><button type="button" onClick={addImage} className="h-10 px-4 rounded-xl bg-white/[0.06] text-white/40 hover:text-white/60 transition"><Plus className="h-4 w-4" /></button></div>
          <div className="flex flex-wrap gap-3">{images.map((img, i) => (<div key={i} className="relative group"><img src={img} alt="" className="h-24 w-24 rounded-xl object-cover border border-white/[0.08]" /><button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="h-3 w-3 text-white" /></button>{i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/70">Main</span>}</div>))}</div>
          <p className="text-xs text-white/30">First image is the main photo. Add multiple angles, lifestyle shots, detail close-ups.</p>
        </section>

        {/* Tags */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Tag className="h-4 w-4" /> Tags</h2>
          <div className="flex flex-wrap gap-2 mb-2">{tags.map((t, i) => (<span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">{t} <button type="button" onClick={() => setTags(p => p.filter((_, idx) => idx !== i))} className="text-blue-300/50 hover:text-red-400"><X className="h-3 w-3" /></button></span>))}</div>
          <div className="flex gap-2"><input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="luxury, cashmere, winter" className="flex-1 h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none" /><button type="button" onClick={addTag} className="h-9 px-3 rounded-lg bg-white/[0.06] text-white/40 hover:text-white/60 transition"><Plus className="h-4 w-4" /></button></div>
        </section>

        {/* SEO */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Search className="h-4 w-4" /> SEO & Search Engine Visibility</h2>
          <div><label className="block text-sm font-medium text-white/80 mb-2">SEO Title <span className="text-white/30">(recommended 50-60 chars)</span></label><input name="metaTitle" defaultValue={product.metaTitle || ""} placeholder={product.name} maxLength={60} className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" /></div>
          <div><label className="block text-sm font-medium text-white/80 mb-2">SEO Description <span className="text-white/30">(recommended 120-160 chars)</span></label><textarea name="metaDescription" defaultValue={product.metaDescription || ""} placeholder={product.description?.substring(0, 160)} maxLength={160} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition resize-none" /></div>
          <div><label className="block text-sm font-medium text-white/80 mb-2">SEO Keywords</label><div className="flex flex-wrap gap-2 mb-2">{seoKeywords.map((k, i) => (<span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">{k} <button type="button" onClick={() => setSeoKeywords(p => p.filter((_, idx) => idx !== i))} className="text-emerald-300/50 hover:text-red-400"><X className="h-3 w-3" /></button></span>))}</div><div className="flex gap-2"><input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())} placeholder="Add keyword" className="flex-1 h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/25 focus:outline-none" /><button type="button" onClick={addKeyword} className="h-9 px-3 rounded-lg bg-white/[0.06] text-white/40 hover:text-white/60 transition"><Plus className="h-4 w-4" /></button></div></div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-xs text-white/30 mb-2">Google Preview</p>
            <p className="text-blue-400 text-base font-medium truncate">{product.metaTitle || product.name}</p>
            <p className="text-emerald-400 text-xs truncate">styledbymaryam.com/products/{product.slug}</p>
            <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{product.metaDescription || product.description}</p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2"><Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}</button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="h-12 px-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition flex items-center gap-2"><Trash2 className="h-4 w-4" /> {deleting ? "..." : "Delete"}</button>
        </div>
      </form>
    </div>
  );
}
