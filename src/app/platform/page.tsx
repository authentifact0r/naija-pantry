import Link from "next/link";
import {
  Globe,
  CreditCard,
  Truck,
  BookOpen,
  RefreshCw,
  Smartphone,
  Store,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Multi-Tenant",
    description:
      "Each store gets its own branding, products, and customer base on a shared platform.",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description:
      "Use your own domain or a branded subdomain. SSL included.",
  },
  {
    icon: CreditCard,
    title: "Payment Integration",
    description:
      "Accept payments via Paystack and Stripe, ready for African and global customers.",
  },
  {
    icon: Truck,
    title: "Shipping Engine",
    description:
      "Weight-based shipping rules, local fresh delivery, and international shipping via DHL.",
  },
  {
    icon: BookOpen,
    title: "Recipes",
    description:
      "Publish recipes that link directly to products, driving discovery and sales.",
  },
  {
    icon: RefreshCw,
    title: "Subscriptions",
    description:
      "Auto-ship for staples. Customers set frequency and get discounts.",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description:
      "White-label mobile experience. Your brand, your store, in your customers' pockets.",
  },
  {
    icon: ShieldCheck,
    title: "SEO & Analytics",
    description:
      "Built-in SEO tools, JSON-LD schema, sitemaps, and Open Graph support.",
  },
];

const tenantShowcase = [
  { name: "Taste of Motherland", color: "#064E3B" },
  { name: "Toks Mimi Foods", color: "#7C3AED" },
];

export default function PlatformLandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-950 to-gray-900 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            The platform powering{" "}
            <span className="text-emerald-400">African food retail</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Launch your own branded food store in minutes. Multi-tenant
            infrastructure, payment processing, shipping logistics, and a
            white-label mobile app -- all included.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/platform/onboard"
              className="inline-flex h-12 items-center rounded-lg bg-emerald-600 px-8 text-base font-medium text-white shadow-lg transition-colors hover:bg-emerald-500"
            >
              Start Your Store
            </Link>
            <Link
              href="#features"
              className="inline-flex h-12 items-center rounded-lg border border-gray-700 px-8 text-base font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need to sell online
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">
              From inventory management to last-mile delivery, Authentifactor
              handles the platform so you can focus on your products.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tenant Showcase */}
      <section className="border-t bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Trusted by growing brands
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Stores already powered by Authentifactor
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            {tenantShowcase.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: t.color }}
                >
                  {t.name[0]}
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to launch your store?
          </h2>
          <p className="mt-4 text-gray-500">
            Get started in under 5 minutes. No technical skills required.
          </p>
          <Link
            href="/platform/onboard"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-emerald-600 px-8 text-base font-medium text-white shadow-lg transition-colors hover:bg-emerald-500"
          >
            Start Your Store
          </Link>
        </div>
      </section>
    </div>
  );
}
