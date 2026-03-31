"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartSheet } from "@/components/shop/cart-sheet";

const categories = [
  { name: "Groceries", href: "/products?category=GROCERIES" },
  { name: "Spices", href: "/products?category=SPICES" },
  { name: "Drinks", href: "/products?category=DRINKS" },
  { name: "Beauty", href: "/products?category=BEAUTY" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Top bar */}
      <div className="bg-emerald-900 px-4 py-1.5 text-center text-xs text-emerald-100">
        Free delivery on orders over ₦25,000 within Lagos
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-lg font-bold text-white">
            N
          </div>
          <span className="hidden text-lg font-bold text-gray-900 sm:block">
            NaijaPantry
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-emerald-900"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/recipes"
            className="rounded-md px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50"
          >
            Recipes
          </Link>
        </nav>

        {/* Search */}
        <div className="hidden flex-1 lg:block">
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search Nigerian foods..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/account">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <CartSheet />
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 py-4 lg:hidden">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search Nigerian foods..." className="pl-9" />
          </div>
          <nav className="flex flex-col gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/recipes"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50"
            >
              Recipes
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
