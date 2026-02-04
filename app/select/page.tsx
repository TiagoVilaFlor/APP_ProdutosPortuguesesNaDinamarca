"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatEur } from "@/app/data/catalog";
import { Accordion } from "@/components/Accordion";
import { ItemRow } from "@/components/ItemRow";
import { useCart } from "@/app/store/cart";
import { useCatalog } from "@/app/hooks/useCatalog";

export default function SelectPage() {
  // GOOGLE SHEET DATA
  const { loading, categories, items } = useCatalog();

  // SCROLL REFS POR CATEGORIA
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // CART
  const { totalItems, subtotalEur, wantsTransport, transportEur, clear } =
    useCart();

  const count = totalItems();
  const subtotal = subtotalEur();
  const transport = transportEur();

  // UI STATE
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string>("");

  // 👉 ORDENAÇÃO INDEPENDENTE POR CATEGORIA
  const [priceOrderByCat, setPriceOrderByCat] = useState<
    Record<string, "asc" | "desc">
  >({});

  // GROUP ITEMS BY CATEGORY + SORT
  const grouped = useMemo(() => {
    return (categories ?? []).map((c) => {
      const order = priceOrderByCat[c.id] ?? "asc";

      const categoryItems = (items ?? [])
        .filter((i) => i.categoryId === c.id)
        .slice()
        .sort((a, b) => {
          const pa = Number(a.priceEur ?? 0);
          const pb = Number(b.priceEur ?? 0);
          return order === "asc" ? pa - pb : pb - pa;
        });

      return {
        ...c,
        items: categoryItems,
      };
    });
  }, [categories, items, priceOrderByCat]);

  const firstCatId = categories?.[0]?.id ?? "";

  // 🔥 SCROLL ROBUSTO PARA TOPO DA CATEGORIA (fonte única de verdade)
  function scrollToCategory(catId: string) {
    setOpenCategoryId(catId);
    setSelectedCategory(catId);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = sectionRefs.current[catId];
        if (!el) return;

        const fixedHeaderHeight = 64; // h-16
        const categoryNav = document.getElementById("category-nav");
        const categoryNavHeight =
          categoryNav?.getBoundingClientRect().height ?? 0;

        const extraOffset = 12;

        const y =
          el.getBoundingClientRect().top +
          window.scrollY -
          (fixedHeaderHeight + categoryNavHeight + extraOffset);

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      });
    });
  }

  return (
    <main className="pb-32 bg-neutral-50">
      {/* HEADER BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-100">
        <div className="mx-auto max-w-md bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Explorar produtos</h1>

          <button
            onClick={() => {
              clear();
              window.location.href = "/";
            }}
            className="rounded-full bg-black text-white px-4 py-2 text-xs font-medium shadow"
          >
            ← Voltar ao Início
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16" />

      {/* CATEGORY NAV */}
      <div
        id="category-nav"
        className="sticky top-16 z-10 bg-white/90 backdrop-blur border-b border-neutral-200"
      >
        <div className="mx-auto max-w-md px-4 py-4">
          <button
            className="flex items-center justify-between w-full px-4 py-3 rounded-lg border bg-white"
            onClick={() => setCategoriesOpen((prev) => !prev)}
          >
            <span className="font-semibold">
              {selectedCategory
                ? "Categoria - " +
                categories?.find((c) => c.id === selectedCategory)?.name
                : "Categorias"}
            </span>
            <span className="text-lg">
              {categoriesOpen ? "▲" : "▼"}
            </span>
          </button>

          {categoriesOpen && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  className={`px-4 py-2 rounded-full border text-sm ${selectedCategory === cat.id
                      ? "bg-black text-white"
                      : "bg-white"
                    }`}
                  onClick={() => {
                    setCategoriesOpen(false);
                    scrollToCategory(cat.id);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="mx-auto max-w-md px-4 space-y-4 mt-4">
        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
            A carregar catálogo…
          </div>
        )}

        {grouped.map((g) => {
          const order = priceOrderByCat[g.id] ?? "asc";

          return (
            <div
              key={g.id}
              ref={(node) => {
                sectionRefs.current[g.id] = node;
              }}
              className="scroll-mt-28"
            >
              <Accordion
                title={g.name}
                open={(openCategoryId || firstCatId) === g.id}
                onToggle={() => {
                  setOpenCategoryId((prev) => {
                    const cur = prev || firstCatId;
                    const next = cur === g.id ? "" : g.id;

                    // 👉 se abriu, fazemos scroll para o topo da categoria
                    if (next === g.id) {
                      scrollToCategory(g.id);
                    }

                    return next;
                  });
                }}
                anchorId={`cat-${g.id}`}
              >
                {/* SORT BUTTON */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() =>
                      setPriceOrderByCat((prev) => ({
                        ...prev,
                        [g.id]: order === "asc" ? "desc" : "asc",
                      }))
                    }
                    className="text-xs text-neutral-600 underline"
                  >
                    {order === "asc"
                      ? "Ordenar por preço ↓"
                      : "Ordenar por preço ↑"}
                  </button>
                </div>

                {g.items.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    Sem produtos nesta categoria.
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {g.items.map((it) => (
                      <ItemRow key={it.id} item={it} />
                    ))}
                  </div>
                )}
              </Accordion>
            </div>
          );
        })}
      </div>

      {/* BOTTOM SUMMARY BAR */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-neutral-700">
              <div className="font-medium">
                {count} {count === 1 ? "item" : "itens"} no carrinho
              </div>
              <div className="text-xs mt-1">
                Subtotal:{" "}
                <span className="font-semibold">
                  {formatEur(subtotal)}
                </span>
              </div>

              {wantsTransport && (
                <div className="text-xs text-neutral-600">
                  Transporte (estimado):{" "}
                  <span className="font-semibold">
                    {formatEur(transport)}
                  </span>
                </div>
              )}
            </div>

            <Link
              href="/review"
              className="rounded-full bg-black px-5 py-3 text-sm text-white font-medium shadow hover:bg-neutral-800 transition"
            >
              Finalizar reserva
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
