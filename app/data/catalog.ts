export type Category = {
  id: string;
  name: string;
  image?: string; // opcional
};

export type CatalogItem = {
  id: string;
  name: string;
  categoryId: string;
  unitLabel?: string;
  priceEur: number;      // preço por unidade (EUR)
  volumeLiters: number;  // usado para calcular caixas (20L/caixa)
  image?: string;
  description?: string;
};

// Regras fixas (podes ajustar)
export const BOX_CAPACITY_LITERS = 20;   // 20L por caixa
export const SHIPPING_EUR_PER_BOX = 20;  // 20€ por caixa

export const formatEur = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);

// Dados fallback (se o Google Sheet não estiver configurado ainda)
export const fallbackCategories: Category[] = [
  { id: "azeites", name: "Azeites" },
  { id: "conservas", name: "Conservas" },
  { id: "doces", name: "Doces" },
];

export const fallbackItems: CatalogItem[] = [
];
