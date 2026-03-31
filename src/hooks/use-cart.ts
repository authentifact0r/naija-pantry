"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuestCartItem } from "@/types";

interface CartStore {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: GuestCartItem[]) => void;
  totalItems: () => number;
  totalWeight: () => number;
  subtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalWeight: () =>
        get().items.reduce(
          (sum, item) =>
            sum + (parseFloat(item.product?.weightKg || "0") * item.quantity),
          0
        ),

      subtotal: () =>
        get().items.reduce(
          (sum, item) =>
            sum + parseFloat(item.product?.price || "0") * item.quantity,
          0
        ),
    }),
    { name: "naija-pantry-cart" }
  )
);
