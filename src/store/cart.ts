"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { brand } from "@/config/brand";

export interface CartItem {
  variantId: string;          // productVariants.id (used as the unique cart key)
  sku: string;
  productName: string;
  variantLabel: string;       // e.g. "50g – Rose" or "100ml – Oud"
  price: number;              // effective price (salePrice ?? price)
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Derived values (keep in state so subscribers re-render on change)
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
}

function deriveCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = subtotal >= brand.freeShippingThreshold ? 0 : items.length === 0 ? 0 : brand.standardShippingFee;
  return {
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      itemCount: 0,
      subtotal: 0,
      shippingFee: 0,
      total: 0,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        const newItems = existing
          ? get().items.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...get().items, { ...item, quantity: 1 }];
        set({ items: newItems, isOpen: true, ...deriveCartTotals(newItems) });
      },

      removeItem: (variantId) => {
        const newItems = get().items.filter((i) => i.variantId !== variantId);
        set({ items: newItems, ...deriveCartTotals(newItems) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) { get().removeItem(variantId); return; }
        const newItems = get().items.map((i) =>
          i.variantId === variantId ? { ...i, quantity } : i
        );
        set({ items: newItems, ...deriveCartTotals(newItems) });
      },

      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0, shippingFee: 0, total: 0 }),
    }),
    {
      name: "ss-cart-v1",
      onRehydrateStorage: () => (state) => {
        // Recalculate derived values on hydration (they aren't persisted separately)
        if (state) {
          const totals = deriveCartTotals(state.items);
          Object.assign(state, totals);
        }
      },
    }
  )
);
