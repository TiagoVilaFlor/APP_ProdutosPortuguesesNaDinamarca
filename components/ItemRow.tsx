"use client";
import type { CatalogItem } from "@/app/data/catalog";
import { formatEur } from "@/app/data/catalog";
import { useCart } from "@/app/store/cart";
import { ItemModal } from "./ItemModal";
import { useState } from "react";

export function ItemRow({ item }: { item: CatalogItem }) {
  const { lines, add, setQty } = useCart();
  const line = lines.find((l) => l.itemId === item.id);
  const qty = line?.qty ?? 0;
  const [openItem, setOpenItem] = useState<CatalogItem | null>(null);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 pr-3">

        {/* IMAGEM DO PRODUTO */}
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-12 w-12 rounded-xl object-cover border border-neutral-200"
            onClick={() => setOpenItem(item)}
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-neutral-100 border border-neutral-200" />
        )}

        {/* TEXTO DO PRODUTO */}
        <div>
          <div
            className="font-medium cursor-pointer hover:underline"
            onClick={() => setOpenItem(item)}
          >{item.name}</div>
          <div className="text-xs text-neutral-500">
            {[item.unitLabel, formatEur(item.priceEur)].filter(Boolean).join(" • ")}
          </div>
        </div>

      </div>


      {qty === 0 ? (
        <button
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white"
          onClick={() =>
            add({
              itemId: item.id,
              name: item.name,
              categoryId: item.categoryId,
              unitLabel: item.unitLabel,
              priceEur: item.priceEur,
              image: item.image,
              volumeLiters: item.volumeLiters,
            })
          }
        >
          Adicionar
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 rounded-lg border" onClick={() => setQty(item.id, qty - 1)}>-</button>
          <div className="w-6 text-center font-medium">{qty}</div>
          <button className="h-9 w-9 rounded-lg border" onClick={() => setQty(item.id, qty + 1)}>+</button>
        </div>
      )}
      <ItemModal item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
