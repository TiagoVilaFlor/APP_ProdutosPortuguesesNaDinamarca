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
  { id: "tdl-azeite-500", name: "Azeite Terra das Lanchas", unitLabel: "500ml", categoryId: "azeites", priceEur: 12.5, volumeLiters: 0.5 },
  { id: "tdl-azeite-1l",  name: "Azeite Terra das Lanchas", unitLabel: "1L",    categoryId: "azeites", priceEur: 22.0, volumeLiters: 1 },
  { id: "sardinha-pt",    name: "Sardinha em azeite",       categoryId: "conservas", priceEur: 4.5, volumeLiters: 0 },
  { id: "doce-figo",      name: "Doce de figo",             categoryId: "doces", priceEur: 5.5, volumeLiters: 0 },
];
