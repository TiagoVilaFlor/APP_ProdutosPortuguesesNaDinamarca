"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogItem } from "@/app/data/catalog";
import { useCart } from "@/app/store/cart";

function renderParagraphs(text?: string) {
  if (!text) return null;

  // Normaliza quebras Windows e remove espaços extra
  const normalized = text.replace(/\r\n/g, "\n").trim();

  // Separa por blocos (linhas em branco = novo parágrafo)
  const blocks = normalized.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  // Se não houver parágrafos, ainda preserva quebras simples
  if (blocks.length <= 1) {
    return (
      <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
        {normalized}
      </p>
    );
  }

  return blocks.map((p, i) => (
    <p key={i} className="mb-3 text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
      {p}
    </p>
  ));
}

export function ItemModal({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}) {
  const { add } = useCart();
  const [zoomOpen, setZoomOpen] = useState(false);

  const hasImage = Boolean(item.image);

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
            className={[
              "flex items-center justify-center bg-neutral-50 rounded-xl p-4",
              hasImage ? "cursor-zoom-in" : "cursor-default",
            ].join(" ")}
            onClick={() => {
              if (hasImage) setZoomOpen(true);
            }}
          >
            {hasImage ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full max-h-72 object-contain"
              />
            ) : (
              <div className="w-full h-40 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm text-neutral-500">
                Sem imagem disponível
              </div>
            )}
          </div>

          {/* Hint */}
          {hasImage && (
            <div className="mt-1 text-xs text-neutral-400 text-center">
              Clica na imagem para ampliar
            </div>
          )}

          {/* Title */}
          <h2 className="mt-3 text-lg font-semibold">{item.name}</h2>

          {/* Description (parágrafos) */}
          <div className="mt-2">
            {item.description ? (
              renderParagraphs(item.description)
            ) : (
              <p className="text-sm text-neutral-600 leading-relaxed">
                Produto selecionado.
              </p>
            )}
          </div>

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
      {zoomOpen && hasImage && (
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
