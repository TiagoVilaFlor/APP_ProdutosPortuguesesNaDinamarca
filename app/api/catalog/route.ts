import { NextResponse } from "next/server";
import Papa from "papaparse";

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;

  const s = String(v ?? "").trim().toLowerCase();
  if (s === "") return false;

  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "sim";
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_CATALOG_URL;

  if (!url) {
    return NextResponse.json({
      categories: [],
      items: [],
      source: "ERROR_NO_ENV",
    });
  }

  const res = await fetch(url, { cache: "no-store" });
  const csvText = await res.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    console.error("CSV parse errors:", parsed.errors);
  }

  const rows = parsed.data as any[];

  // MAP ITEMS (SAFE)
  const items = rows
    .map((r) => ({
      id: r.id?.trim(),
      categoryId: r.categoryid?.trim(),
      name: r.name?.trim(),
      priceEur: Number(r.priceEur),
      image: r.image || "",
      description: r.description || "",
      active: parseBool(r.active),
      order: Number(r.order || 0),
    }))
    .filter(
      (i) =>
        i.id &&
        i.categoryId &&
        i.name &&
        !Number.isNaN(i.priceEur) &&
        i.active
    );

  // BUILD CATEGORIES (CLEAN)
  const catMap = new Map<string, { id: string; name: string }>();

  items.forEach((i) => {
    if (!catMap.has(i.categoryId)) {
      catMap.set(i.categoryId, {
        id: i.categoryId,
        name: i.categoryId,
      });
    }
  });

  const categories = Array.from(catMap.values());

  return NextResponse.json({
    categories,
    items,
    source: "GOOGLE_SHEET",
  });
}
