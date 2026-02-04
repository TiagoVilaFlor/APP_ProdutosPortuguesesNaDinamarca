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

  // CART
  const {
    totalItems,
    subtotalEur,
    wantsTransport,
    transportEur,
    clear,
  } = useCart();

  const count = totalItems();
  const subtotal = subtotalEur();
  const transport = transportEur();

  // ===============================
  // UI STATE
  // ===============================
  const [openCategoryId, setOpenCategoryId] = useState<string>("");
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);

  // ===============================
  // GROUP BY CATEGORY → SUBCATEGORY
  // (se não tiveres subcategorias,
  // funciona exatamente igual)
  // ===============================
  const grouped = useMemo(() => {
    return (categories ?? []).map((c) => {
      const itemsInCategory = (items ?? []).filter(
        (i) => i.categoryId === c.id
      );

      const subMap = new Map<string, typeof itemsInCategory>();

      itemsInCategory.forEach((i) => {
        const key = i.subcategoryId || "__no_sub__";
        if (!subMap.has(key)) subMap.set(key, []);
        subMap.get(key)!.push(i);
      });

      return {
        ...c,
        subcategories: Array.from(subMap.entries()).map(
          ([id, items]) => ({
            id,
            name: id === "__no_sub__" ? null : id,
            items,
          })
        ),
      };
    });
  }, [categories, items]);

  // ===============================
  // SCROLL HANDLING
  // ===============================
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const firstCatId = categories?.[0]?.id;

  function scrollToCategory(catId: string) {
    setOpenCategoryId(catId);
    setCategoriesCollapsed(true); // 🔥 AUTO-COLLAPSE
    const el = sectionRefs.current[catId];
    if (el) {
      setTimeout(
        () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
        80
      );
    }
  }

  return (
    <main className="pb-32 bg-neutral-50">
      {/* ================= HEADER ================= */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-100">
        <div className="mx-auto max-w-md bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-medium tracking-tight">
            Explorar produtos
          </h1>

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

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* ================= CATEGORY NAV (COLLAPSABLE) ================= */}
      <div className="sticky top-16 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-md px-4 py-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-800">
              Categorias
            </h2>

            <button
              onClick={() => setCategoriesCollapsed((v) => !v)}
              className="text-xs font-medium text-neutral-600 hover:text-black transition"
            >
              {categoriesCollapsed ? "Mostrar" : "Esconder"}
            </button>
          </div>

          {/* Category pills */}
          {!categoriesCollapsed && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(categories ?? []).map((c) => {
                const active = (openCategoryId || firstCatId) === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => scrollToCategory(c.id)}
                    className={[
                      "rounded-full px-4 py-2 text-sm border transition font-medium",
                      active
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                    ].join(" ")}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= PRODUCT LIST ================= */}
      <div className="mx-auto max-w-md px-4 space-y-4 mt-4">
        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
            A carregar catálogo…
          </div>
        )}

        {!loading && (categories?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-red-600 shadow-sm">
            ❌ Não foi possível carregar categorias.
            <br />
            Verifica o Google Sheet e o link em{" "}
            <code>.env.local</code>.
          </div>
        )}

        {grouped.map((g) => (
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
              onToggle={() =>
                setOpenCategoryId((prev) => {
                  const cur = prev || firstCatId || "";
                  return cur === g.id ? "" : g.id;
                })
              }
              anchorId={`cat-${g.id}`}
            >
              {g.subcategories.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Sem produtos nesta categoria.
                </p>
              ) : (
                <div className="space-y-4">
                  {g.subcategories.map((sc) => (
                    <div key={sc.id}>
                      {sc.name && (
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {sc.name}
                        </h4>
                      )}

                      <div className="divide-y divide-neutral-100">
                        {sc.items.map((it) => (
                          <ItemRow key={it.id} item={it} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Accordion>
          </div>
        ))}
      </div>

      {/* ================= BOTTOM SUMMARY BAR ================= */}
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
