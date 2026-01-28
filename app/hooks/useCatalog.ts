"use client";
import { useEffect, useState } from "react";
import type { Category, CatalogItem } from "@/app/data/catalog";

export function useCatalog() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setCategories(data.categories ?? []);
        setItems(data.items ?? []);
        setSource(data.source ?? "");
      } catch {
        // leave empty
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { loading, categories, items, source };
}
