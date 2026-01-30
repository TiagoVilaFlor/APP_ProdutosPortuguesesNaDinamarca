"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatEur, SHIPPING_EUR_PER_BOX, BOX_CAPACITY_LITERS } from "@/app/data/catalog";
import { useCart } from "@/app/store/cart";

export default function ReviewPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [agree, setAgree] = useState(false);

  const {
    lines,
    setQty,
    remove,
    clear,
    wantsTransport,
    setWantsTransport,
    totalItems,
    subtotalEur,
    boxesNeeded,
    totalLiters,
  } = useCart();

  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const count = totalItems();
  const subtotal = subtotalEur();
  const boxes = boxesNeeded();
  const liters = totalLiters();

  // Transporte: 20€ por caixa (estimado)
  const transport = 20

  // TOTAL = subtotal + transporte
  const total = useMemo(() => subtotal + transport, [subtotal, transport]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""),
      notes: String(fd.get("notes") || ""),
      agree: fd.get("agree") === "on",
      wantsTransport,
      // inclui linhas completas (inclui image, preço, etc.)

      lines,
      // info extra útil para email/admin
      boxesEstimated: boxes,
      litersEstimated: liters,
      subtotalEur: subtotal,
      transportEur: transport,
      totalEur: total,
    };

    if (!payload.agree) return setStatus("Tens de confirmar a checkbox para submeter a reserva.");

    const res = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      setStatus("Erro ao enviar. " + t);
      return;
    }

    clear();
    router.push("/success");
  }

  return (
    <main className="p-6">
      {/* HEADER FIXO CHECKOUT */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-100">
        <div className="mx-auto max-w-md bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Checkout</h1>

          <Link href="/select" className="rounded-full bg-black text-white px-4 py-2 text-xs font-medium shadow">
            ← Voltar e editar
          </Link>

        </div>
      </div>

      {/* Spacer para não tapar conteúdo */}
      <div className="h-16" />

      {count === 0 ? (
        <div className="mt-6 rounded-xl border border-neutral-200 p-4">
          <p className="text-neutral-700">Não tens itens selecionados.</p>
          <Link href="/select" className="mt-3 inline-block underline">
            Ir para seleção
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {lines.map((l) => (
              <div key={l.itemId} className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* LEFT: IMAGE + TEXT */}
                  <div className="flex items-start gap-3">
                    <img
                      src={l.image}
                      alt={l.name}
                      className="h-14 w-14 rounded-xl object-cover border border-neutral-200"
                    />

                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-xs text-neutral-500">
                        {[l.unitLabel, formatEur(l.priceEur)].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  </div>

                  <button className="text-sm underline" onClick={() => remove(l.itemId)}>
                    Remover
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="h-9 w-9 rounded-lg border"
                      onClick={() => setQty(l.itemId, Math.max(0, l.qty - 1))}
                      aria-label="Diminuir quantidade"
                    >
                      -
                    </button>
                    <div className="w-8 text-center font-medium">{l.qty}</div>
                    <button
                      className="h-9 w-9 rounded-lg border"
                      onClick={() => setQty(l.itemId, l.qty + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-sm font-semibold">{formatEur(l.priceEur * l.qty)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-700">Subtotal</div>
                <div className="font-semibold">{formatEur(subtotal)}</div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-neutral-700">Transporte</div>
                <div className="font-semibold">{formatEur(transport)}</div>
              </div>
              <p className="mt-2 text-xs text-neutral-500"> Este valor é figurativo, vamos confirmar posteriormente por
                email face ao volume total dos teus artigos. </p>

              <div className="mt-3 border-t border-neutral-200 pt-3 flex items-center justify-between">
                <div className="text-base font-semibold">Total estimado</div>
                <div className="text-lg font-semibold">{formatEur(total)}</div>
              </div>

              <p className="mt-2 text-xs text-neutral-500">
                O total final vai ser confirmado por email após embalamento.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                *Uma vez que este serviço é comunitário e pessoal não serão
                emitidas faturas.
              </p>
            </div>
          </div>

          {(
            <form
              ref={formRef}
              onSubmit={submit}
              className="mt-6 rounded-2xl border border-neutral-200 p-4"
            >
              <h2 className="font-semibold">Os meus dados</h2>

              <label className="mt-3 block text-sm">
                Nome
                <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>

              <label className="mt-3 block text-sm">
                Email
                <input name="email" type="email" required pattern="^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$" className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>

              <label className="mt-3 block text-sm">
                Telefone
                <input name="address" type="tel" placeholder="Ex: 12121212 or 123123123" required pattern="[0-9]{9}|[0-9]{8}" className="mt-1 w-full rounded-lg border px-3 py-2"/>
              </label>

              <label className="mt-3 block text-sm">
                Notas (opcional)
                <textarea
                  name="notes"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={2}
                  placeholder="Ex.: preferia receber a encomenda em casa…"
                />
              </label>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  name="agree"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                Confirmo que pretendo submeter esta reserva com o conhecimento de
            ser uma compra pessoal e em envio comunitário.
              </label>

              <div className="mt-4 flex gap-3">
                <button className="flex-1 rounded-xl border px-4 py-3"
                  onClick={() => {
                    clear();
                    router.push("/");
                  }}
                >Cancelar tudo</button>
                <button
                  type="submit"
                  disabled={!agree}
                  className={`flex-1 rounded-xl px-4 py-3 font-medium transition ${agree
                    ? "bg-black text-white"
                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    }`}
                >
                  Confirmar e submeter
                </button>
              </div>

              {status && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">{status}</div>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                *Ao clicar no botão "Confirmar e submeter", pode demorar alguns segundos até ver a página de sucesso. Obrigado pela compreensão.
              </p>
            </form>
          )}
        </>
      )}
    </main>
  );
}
