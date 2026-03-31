import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string, currency: string = "GBP"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = currency === "NGN" ? "en-NG" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(num);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NP-${timestamp}-${random}`;
}

export function getStockStatus(quantity: number): {
  label: string;
  variant: "success" | "warning" | "destructive";
} {
  if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" };
  if (quantity <= 10) return { label: "Low Stock", variant: "warning" };
  return { label: "In Stock", variant: "success" };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
