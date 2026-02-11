"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  formatEur,
  SHIPPING_EUR_PER_BOX,
  BOX_CAPACITY_LITERS,
} from "@/app/data/catalog";
import { useCart } from "@/app/store/cart";

export default function ReviewPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ NEW
  const [status, setStatus] = useState<string | null>(null);

  const {
    lines,
    setQty,
    remove,
    clear,
    wantsTransport,
    totalItems,
    subtotalEur,
    boxesNeeded,
    totalLiters,
  } = useCart();

  const count = totalItems();
  const subtotal = subtotalEur();
  const boxes = boxesNeeded();
  const liters = totalLiters();

  const transport = 20;
  const total = useMemo(() => subtotal + transport, [subtotal]);

  // ================= SUBMIT =================
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // prevent double submit

    setLoading(true);
    setStatus(null);

    const fd = new FormData(e.currentTarget);

    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""),
      notes: String(fd.get("notes") || ""),
      agree: fd.get("agree") === "on",
      wantsTransport,
      lines,
      boxesEstimated: boxes,
      litersEstimated: liters,
      subtotalEur: subtotal,
      transportEur: transport,
      totalEur: total,
    };

    if (!payload.agree) {
      setLoading(false);
      return setStatus(
        "Tens de confirmar a checkbox para submeter a reserva."
      );
    }

    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      clear();
      router.push("/success");
    } catch (err: any) {
      setStatus("Erro ao enviar reserva. " + err.message);
      setLoading(false);
    }
  }

  return (
    <main className="p-6">
      {/* ================= LOADING OVERLAY ================= */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-5 shadow-xl flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">
              A processar reserva…
            </span>
          </div>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-neutral-100">
        <div className="mx-auto max-w-md bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Checkout</h1>

          <Link
            href="/select"
            className="rounded-full bg-black text-white px-4 py-2 text-xs font-medium shadow"
          >
            ← Voltar e editar
          </Link>
        </div>
      </div>

      <div className="h-16" />

      {/* ================= EMPTY ================= */}
      {count === 0 ? (
        <div className="mt-6 rounded-xl border border-neutral-200 p-4">
          <p className="text-neutral-700">Não tens itens selecionados.</p>
          <Link href="/select" className="mt-3 inline-block underline">
            Ir para seleção
          </Link>
        </div>
      ) : (
        <>
          {/* ================= ITEMS ================= */}
          <div className="mt-4 space-y-3">
            {lines.map((l) => (
              <div
                key={l.itemId}
                className="rounded-2xl border border-neutral-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={l.image}
                      alt={l.name}
                      className="h-14 w-14 rounded-xl object-cover border border-neutral-200"
                    />

                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-xs text-neutral-500">
                        {[l.unitLabel, formatEur(l.priceEur)]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                  </div>

                  <button
                    className="text-sm underline"
                    onClick={() => remove(l.itemId)}
                  >
                    Remover
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="h-9 w-9 rounded-lg border"
                      onClick={() =>
                        setQty(l.itemId, Math.max(0, l.qty - 1))
                      }
                    >
                      -
                    </button>

                    <div className="w-8 text-center font-medium">
                      {l.qty}
                    </div>

                    <button
                      className="h-9 w-9 rounded-lg border"
                      onClick={() => setQty(l.itemId, l.qty + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-sm font-semibold">
                    {formatEur(l.priceEur * l.qty)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ================= TOTAL ================= */}
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-semibold">
                  {formatEur(subtotal)}
                </span>
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-sm">Transporte</span>
                <span className="font-semibold">
                  {formatEur(transport)}
                </span>
              </div>

              <div className="mt-3 border-t pt-3 flex justify-between">
                <span className="font-semibold">
                  Total estimado
                </span>
                <span className="font-semibold text-lg">
                  {formatEur(total)}
                </span>
              </div>
            </div>
          </div>

          {/* ================= FORM ================= */}
          <form
            ref={formRef}
            onSubmit={submit}
            className="mt-6 rounded-2xl border border-neutral-200 p-4"
          >
            <h2 className="font-semibold">Os meus dados</h2>

            <input
              name="name"
              required
              placeholder="Nome"
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <input
              name="address"
              required
              placeholder="Telefone"
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <textarea
              name="notes"
              rows={2}
              placeholder="Notas"
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                name="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              Confirmo a submissão da reserva
            </label>

            {/* ================= BUTTONS ================= */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border px-4 py-3"
                onClick={() => {
                  clear();
                  router.push("/");
                }}
              >
                Cancelar tudo
              </button>

              <button
                type="submit"
                disabled={!agree || loading}
                className={`
                  flex-1 rounded-xl px-4 py-3 font-medium
                  flex items-center justify-center gap-2
                  ${
                    loading || !agree
                      ? "bg-neutral-300 text-neutral-500"
                      : "bg-black text-white hover:bg-neutral-800"
                  }
                `}
              >
                {loading && (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}

                {loading
                  ? "A submeter..."
                  : "Confirmar e submeter"}
              </button>
            </div>

            {status && (
              <div className="mt-4 text-sm text-red-600">
                {status}
              </div>
            )}
          </form>
        </>
      )}
    </main>
  );
}