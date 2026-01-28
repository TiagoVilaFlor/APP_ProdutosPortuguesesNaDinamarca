"use client";

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

  if (!item) return null;

  function handleAdd() {
    add({
      itemId: item.id!,                     // obrigatório
    name: item.name ?? "Produto sem nome", // fallback seguro
    priceEur: item.priceEur ?? 0,          // fallback seguro
    categoryId: item.categoryId,
    unitLabel: item.unitLabel,
    volumeLiters: item.volumeLiters,
    image: item.image,
    description: item.description ?? "",
    });
    onClose(); // fecha modal depois de adicionar
  }

  return (
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
        >
          ✕
        </button>

        {/* Image */}
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-48 object-cover rounded-xl border"
        />

        {/* Title */}
        <h2 className="mt-3 text-lg font-semibold">{item.name}</h2>

        {/* Description */}
        <p className="mt-2 text-sm text-neutral-600">
          {item.description || "Produto selecionado Terra das Lanchas."}
        </p>

        {/* Price */}
        <div className="mt-3 text-lg font-semibold">
          {item.priceEur.toFixed(2)} €
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
  );
}
