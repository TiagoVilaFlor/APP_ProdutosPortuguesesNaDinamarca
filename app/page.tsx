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
        <b>Olá Portugueses</b>, estamos a testar uma nova forma simples e comunitária de trazer produtos portugueses até à Dinamarca.
O teu feedback ajuda-nos a melhorar este projeto e preparar futuras entregas.
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <div className="font-semibold">Como funciona</div>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Seleciona os produtos e quantidades</li>
          <li>Revê o carrinho</li>
          <li>Submete a reserva e recebes confirmação por email</li>
          <li>Quando houver volume suficiente para trazer uma nova palette (esperemos mensalmente), informamos para pagamento e entrega</li>
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <div className="font-semibold">Como calculamos o custo</div>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Preço dos produtos selecionados</li>
          <li>Transporte base: 20€ máximo por caixa de 32 l/cm3 (35*28*33cm) (partilhada com outros clientes sempre que possível para reduzir custos, o que vos pode ficar a <u>menos de 20€ de transporte</u>)</li>
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
      <p className="mt-4 text-xs text-neutral-500">
        **Uma vez que este serviço é comunitário e pessoal não serão emitidas faturas.
      </p>
    </main>
  );
}
