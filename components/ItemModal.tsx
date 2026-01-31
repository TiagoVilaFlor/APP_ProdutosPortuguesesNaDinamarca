"use client";

import { useEffect, useState } from "react";
import { CatalogItem } from "@/app/data/catalog";
import { useCart } from "@/app/store/cart";

export function ItemModal({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}) {
  const { add } = useCart();
  const [zoomOpen, setZoomOpen] = useState(false);

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (zoomOpen) setZoomOpen(false);
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, onClose]);

  function handleAdd() {
    add({
      itemId: item.id!,
      name: item.name ?? "Produto sem nome",
      priceEur: item.priceEur ?? 0,
      categoryId: item.categoryId,
      unitLabel: item.unitLabel,
      volumeLiters: item.volumeLiters,
      image: item.image,
      description: item.description ?? "",
    });
    onClose();
  }

  return (
    <>
      {/* ================= MODAL ================= */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl relative animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-neutral-500 text-lg"
            aria-label="Fechar"
          >
            ✕
          </button>

          {/* Image */}
          <div
            className="flex items-center justify-center bg-neutral-50 rounded-xl p-4 cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full max-h-72 object-contain"
            />
          </div>

          {/* Hint */}
          <div className="mt-1 text-xs text-neutral-400 text-center">
            Clica na imagem para ampliar
          </div>

          {/* Title */}
          <h2 className="mt-3 text-lg font-semibold">{item.name}</h2>

          {/* Description */}
          <p className="mt-2 text-sm text-neutral-600">
            {item.description || "Produto selecionado Terra das Lanchas."}
          </p>

          {/* Price */}
          <div className="mt-3 text-lg font-semibold">
            {(item.priceEur ?? 0).toFixed(2)} €
          </div>

          {/* CTA */}
          <button
            onClick={handleAdd}
            className="mt-4 w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition"
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>

      {/* ================= ZOOM OVERLAY ================= */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoomOpen(false)}
        >
          <img
            src={item.image}
            alt={item.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </>
  );
}
