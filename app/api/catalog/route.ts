import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_CATALOG_URL;

  if (!url) {
    return NextResponse.json({
      categories: [],
      items: [],
      source: "ERROR_NO_ENV",
    });
  }

  const res = await fetch(url);
  const text = await res.text();

  const rows = text.split("\n").slice(1);
  const items = rows
    .map((r) => {
      const [id, categoryId, name, priceEur, image, description, active, order] =
        r.split(",");

      return {
        id,
        categoryId,
        name,
        priceEur: Number(priceEur),
        image,
        description,
        active,
        order: Number(order),
      };
    })
    .filter((i) => i.id && i.active !== "no");

  // categories auto
  const catMap = new Map();
  items.forEach((i) => {
    if (!catMap.has(i.categoryId)) {
      catMap.set(i.categoryId, { id: i.categoryId, name: i.categoryId });
    }
  });

  const categories = Array.from(catMap.values());

  return NextResponse.json({
    categories,
    items,
    source: "GOOGLE_SHEET",
  });
}
