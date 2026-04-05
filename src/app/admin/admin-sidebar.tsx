"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Package, BarChart3, Warehouse, ShoppingCart, Zap, Box, LogOut,
  CreditCard, Palette, Search, Users, Truck, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Box },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { href: "/admin/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/branding", label: "Branding", icon: Palette },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/billing", label: "Account & Billing", icon: CreditCard },
];

interface Props {
  tenantName: string;
  tenantInitial: string;
  tenantColor: string;
  tenantSlug: string;
}

export function AdminSidebar({ tenantName, tenantInitial, tenantColor, tenantSlug }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserve tenant param from URL or from server prop
  const tenant = searchParams.get("tenant") || tenantSlug;
  const tenantParam = tenant ? `?tenant=${tenant}` : "";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-white/[0.06] bg-black/40 backdrop-blur-xl lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-white/[0.06] px-6">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: tenantColor }}
          >
            {tenantInitial}
          </div>
          <span className="font-semibold text-white truncate">{tenantName}</span>
        </div>

        <nav className="space-y-0.5 p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={`${href}${tenantParam}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-white/[0.04] text-white/40"
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {label}
                {isActive && <ChevronRight className="ml-auto h-3 w-3 text-white/30" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/[0.06] p-3">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/30 hover:bg-red-500/[0.06] hover:text-red-400 transition-all"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            Sign Out
          </a>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-white/[0.06] p-3 lg:hidden">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white mr-1"
          style={{ backgroundColor: tenantColor }}
        >
          {tenantInitial}
        </div>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={`${href}${tenantParam}`}
            className={cn(
              "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-white/[0.1] text-white"
                : "bg-white/[0.04] text-white/50"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}
