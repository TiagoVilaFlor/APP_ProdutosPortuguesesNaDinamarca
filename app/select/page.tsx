"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatEur } from "@/app/data/catalog";
import { Accordion } from "@/components/Accordion";
import { ItemRow } from "@/components/ItemRow";
import { useCart } from "@/app/store/cart";
import { useCatalog } from "@/app/hooks/useCatalog";

type GroupedCategory = {
  id: string;
  name: string;
  items: any[];
};

export default function SelectPage() {
  /* =======================
     DATA (GOOGLE SHEET)
  ======================= */
  const { loading, categories, items } = useCatalog();

  /* =======================
     CART
  ======================= */
  const { totalItems, subtotalEur, clear } = useCart();

  const count = totalItems();
  const subtotal = subtotalEur();

  /* =======================
     UI STATE
  ======================= */
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [openCategoryId, setOpenCategoryId] = useState<string>("all");
  const [expandAll, setExpandAll] = useState<boolean>(false);

  /* =======================
     GROUPED CATEGORIES
  ======================= */
  const grouped: GroupedCategory[] = useMemo(() => {
    const allItems = items ?? [];

    const realCategories =
      (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        items: allItems.filter((i) => i.categoryId === c.id),
      })) ?? [];

    return [
      {
        id: "all",
        name: "Todos os produtos",
        items: allItems,
      },
      ...realCategories,
    ];
  }, [categories, items]);

  /* =======================
     SCROLL TO CATEGORY
  ======================= */
  function scrollToCategory(catId: string) {
    setOpenCategoryId(catId);
    setExpandAll(false);

    const el = sectionRefs.current[catId];
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <main className="pb-32">
      {/* =======================
          HEADER (FIXED)
      ======================= */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-100">
        <div className="mx-auto max-w-md bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Explorar produtos</h1>
          <button
            onClick={() => {
              clear();
              window.location.href = "/";
            }}
            className="bg-black text-white px-4 py-2 rounded-full text-xs font-medium shadow"
          >
            ← Voltar ao Início
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16" />

      {/* =======================
          CATEGORY NAV
      ======================= */}
      <div className="sticky top-16 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categorias</h2>
            <button
              onClick={() => {
                setExpandAll((v) => !v);
                setOpenCategoryId("");
              }}
              className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-neutral-100"
            >
              {expandAll ? "Fechar todas" : "Expandir todas"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {grouped.map((c) => {
              const active = openCategoryId === c.id && !expandAll;
              return (
                <button
                  key={c.id}
                  onClick={() => scrollToCategory(c.id)}
                  className={[
                    "rounded-full px-4 py-2 text-sm border transition",
                    active
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-700",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =======================
          PRODUCT LIST
      ======================= */}
      <div className="p-5 space-y-3">
        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            A carregar catálogo…
          </div>
        )}

        {!loading &&
          grouped.map((g) => (
            <div
              key={g.id}
              ref={(node) => {
                sectionRefs.current[g.id] = node;
              }}
              className="scroll-mt-32"
            >
              <Accordion
                title={g.name}
                open={expandAll || openCategoryId === g.id}
                onToggle={() =>
                  setOpenCategoryId((prev) =>
                    prev === g.id ? "" : g.id
                  )
                }
              >
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
          ))}
      </div>

      {/* =======================
          FOOTER SUMMARY
      ======================= */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-neutral-700">
              <div className="font-semibold">Resumo</div>
              <div className="mt-1 text-xs">
                Subtotal:{" "}
                <span className="font-semibold">
                  {formatEur(subtotal)}
                </span>
              </div>
            </div>

            <Link
              href="/review"
              className="rounded-xl bg-black px-4 py-3 text-sm text-white font-semibold"
            >
              Finalizar reserva
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
