import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="p-6">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <h1 className="text-xl font-semibold">Reserva submetida ✅</h1>
        <p className="mt-2 text-neutral-700">
          Enviámos um email com o resumo da tua reserva. Se não aparecer, verifica o spam.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/" className="block w-full rounded-xl bg-black px-4 py-3 text-center text-white font-semibold">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
