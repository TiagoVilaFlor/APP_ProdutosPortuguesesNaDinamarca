"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BOX_CAPACITY_LITERS, SHIPPING_EUR_PER_BOX } from "@/app/data/catalog";

export type CartLine = {
  itemId: string;
  name: string;
  categoryId: string;
  unitLabel?: string;
  priceEur: number;
  volumeLiters: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  wantsTransport: boolean;

  add: (item: Omit<CartLine, "qty">) => void;
  setQty: (itemId: string, qty: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  setWantsTransport: (v: boolean) => void;

  totalItems: () => number;
  subtotalEur: () => number;

  totalLiters: () => number;
  boxesNeeded: () => number;
  transportEur: () => number;

  totalEur: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      wantsTransport: false,

      add: (item) =>
        set((s) => {
          const found = s.lines.find((l) => l.itemId === item.itemId);
          if (found) return { lines: s.lines.map((l) => (l.itemId === item.itemId ? { ...l, qty: l.qty + 1 } : l)) };
          return { lines: [...s.lines, { ...item, qty: 1 }] };
        }),

      setQty: (itemId, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.itemId !== itemId)
              : s.lines.map((l) => (l.itemId === itemId ? { ...l, qty } : l)),
        })),

      remove: (itemId) => set((s) => ({ lines: s.lines.filter((l) => l.itemId !== itemId) })),

      clear: () => set({ lines: [], wantsTransport: false }),

      setWantsTransport: (v) => set({ wantsTransport: v }),

      totalItems: () => get().lines.reduce((acc, l) => acc + l.qty, 0),

      subtotalEur: () => get().lines.reduce((acc, l) => acc + l.priceEur * l.qty, 0),

      totalLiters: () => get().lines.reduce((acc, l) => acc + (l.volumeLiters ?? 0) * l.qty, 0),

      boxesNeeded: () => {
        const liters = get().totalLiters();
        if (liters <= 0) return 0;
        return Math.ceil(liters / BOX_CAPACITY_LITERS);
      },

      transportEur: () => (get().wantsTransport ? get().boxesNeeded() * SHIPPING_EUR_PER_BOX : 0),

      totalEur: () => get().subtotalEur() + 20,
    }),
    { name: "tdl-cart-eur-gsheets-v1" }
  )
);
