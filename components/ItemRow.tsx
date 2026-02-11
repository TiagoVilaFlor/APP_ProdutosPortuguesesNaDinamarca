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
  const hasFreeTransport = item.name?.includes("Terra das Lanchas")

  return (
    <div className="flex items-center gap-3 py-3">
      {/* IMAGE */}
      <div className="flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-12 w-12 rounded-xl object-cover border border-neutral-200 cursor-pointer"
            onClick={() => setOpenItem(item)}
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-neutral-100 border border-neutral-200" />
        )}
      </div>

      {/* TEXT (flex + truncation) */}
      <div className="flex-1 min-w-0">
        <div
          className="font-medium cursor-pointer hover:underline line-clamp-3"
          onClick={() => setOpenItem(item)}
        >
          {hasFreeTransport && (
            <span className="bg-green-700 text-white font-semibold text-[10px] px-2 py-1 rounded-full">
              🚚 TRANSPORTE GRÁTIS
            </span>
          )}
          {hasFreeTransport && (
            <span>
              &nbsp;
            </span>
          )}
           {item.name}
        </div>

        <div className="text-xs text-neutral-500 mt-0.5 truncate">
          {[item.unitLabel, formatEur(item.priceEur)]
            .filter(Boolean)
            .join(" • ")}
        </div>
      </div>

      {/* ACTIONS (fixed width) */}
      <div className="flex-shrink-0 w-[88px] flex justify-end">
        {qty === 0 ? (
          <button
            className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white w-full"
            onClick={() =>
              add({
                itemId: item.id,
                name: item.name ?? "Produto sem nome",
                categoryId: item.categoryId,
                unitLabel: item.unitLabel,
                priceEur: item.priceEur,
                image: item.image,
                volumeLiters: item.volumeLiters,
                description: item.description,
              })
            }
          >
            Adicionar
          </button>
        ) : (
          <div className="flex items-center gap-1 w-full justify-between">
            <button
              className="h-9 w-9 rounded-lg border"
              onClick={() => setQty(item.id, qty - 1)}
            >
              −
            </button>
            <div className="w-4 text-center font-medium text-sm">
              {qty}
            </div>
            <button
              className="h-9 w-9 rounded-lg border"
              onClick={() => setQty(item.id, qty + 1)}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {openItem && (
        <ItemModal item={openItem} onClose={() => setOpenItem(null)} />
      )}
    </div>
  );
}
