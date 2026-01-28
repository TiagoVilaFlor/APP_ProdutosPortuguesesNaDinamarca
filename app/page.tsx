import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <img
        src="/images/PPDK.jpg"
        alt="Produtos portugueses selecionados"
        className="mt-4 mb-4 w-full h-64 object-cover rounded-2xl"
      />
      <p className="mt-3 text-neutral-700">
        Estamos a testar uma nova forma simples de reservar produtos portugueses na Dinamarca.
O teu feedback ajuda-nos a melhorar este projeto e preparar futuras entregas.
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <div className="font-semibold">Como funciona</div>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Seleciona os produtos e quantidades</li>
          <li>Revê o carrinho</li>
          <li>Submete a reserva e recebes confirmação por email</li>
          <li>Quando houver volume suficiente para fazer uma palette, informamos para pagamento</li>
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <div className="font-semibold">Como calculamos o custo</div>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Preço dos produtos selecionados</li>
          <li>Transporte: 20€ por caixa de 20L (35*28*33cm) (partilhada com outros clientes sempre que possível para reduzir custos)</li>
        </ol>
      </div>

      <div className="mt-8">
        <Link
          href="/select"
          className="block w-full rounded-xl bg-black px-4 py-3 text-center text-white font-medium active:scale-[0.99]"
        >
          Selecionar produtos
        </Link>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        *Isto não é um compra imediata, apenas uma reserva sem compromisso
      </p>
    </main>
  );
}
