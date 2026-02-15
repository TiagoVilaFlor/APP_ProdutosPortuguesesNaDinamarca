import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";
import {
  formatEur,
  BOX_CAPACITY_LITERS,
  SHIPPING_EUR_PER_BOX,
} from "@/app/data/catalog";

/* ================= TYPES ================= */

type CartLine = {
  itemId: string;
  name: string;
  categoryId: string;
  unitLabel?: string;
  priceEur: number;
  volumeLiters: number;
  qty: number;
};

type Body = {
  name: string;
  email: string;
  address: string;
  notes?: string;
  agree: boolean;
  wantsTransport?: boolean;
  lines: CartLine[];
};

/* ================= HELPERS ================= */

function buildSummary(lines: CartLine[], wantsTransport: boolean) {
  const normalized = lines.map((l) => ({
    label: [l.name, l.unitLabel].filter(Boolean).join(" - "),
    qty: l.qty,
    priceEur: l.priceEur,
    lineTotalEur: l.priceEur * l.qty,
    volumeLiters: l.volumeLiters,
    id: l.itemId,
  }));

  const liters = lines.reduce(
    (acc, l) => acc + (l.volumeLiters ?? 0) * l.qty,
    0
  );

  const subtotal = normalized.reduce(
    (acc, x) => acc + x.lineTotalEur,
    0
  );

  const boxes =
    liters > 0
      ? Math.ceil(liters / BOX_CAPACITY_LITERS)
      : 0;

  const transport = 20

  const total = subtotal + transport;

  return {
    normalized,
    subtotal,
    liters,
    boxes,
    transport,
    total,
  };
}

/* ================= RATE LIMIT ================= */

const rateMap =
  (globalThis as any).__tdl_rateMap ||
  new Map<string, { count: number; ts: number }>();

(globalThis as any).__tdl_rateMap = rateMap;

function rateLimit(
  ip: string,
  limit = 8,
  windowMs = 10 * 60 * 1000
) {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.ts > windowMs) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  rateMap.set(ip, entry);
  return true;
}

/* ================= EXCEL BUILDER ================= */

async function buildExcel(
  body: Body,
  summary: ReturnType<typeof buildSummary>,
  isClient: boolean
) {
  const workbook = new ExcelJS.Workbook();

  /* Sheet 1 — Itens */
  const itemsSheet =
    workbook.addWorksheet("Itens");

  if (isClient) {
    itemsSheet.columns = [
      { header: "Produto", key: "name", width: 80 },
      { header: "Qtd", key: "qty", width: 20 },
      { header: "Preço Uni. €", key: "priceuni", width: 14 },
      { header: "Preço Total €", key: "price", width: 14 },
    ];
  } else {
    itemsSheet.columns = [
      { header: "#", key: "id", width: 15 },
      { header: "Produto", key: "name", width: 80 },
      { header: "Qtd", key: "qty", width: 20 },
      { header: "Preço Uni. €", key: "priceuni", width: 14 },
      { header: "Preço Total €", key: "price", width: 14 },
    ];
  }

  if (isClient) {
    summary.normalized.forEach((x) => {
      itemsSheet.addRow({
        name: x.label,
        qty: x.qty,
        priceuni: x.priceEur,
        price: x.priceEur * x.qty,
      });
    });
  } else {
    summary.normalized.forEach((x) => {
      itemsSheet.addRow({
        id: x.id,
        name: x.label,
        qty: x.qty,
        priceuni: x.priceEur,
        price: x.priceEur * x.qty,
      });
    });
  }


  itemsSheet.addRow({});
  itemsSheet.addRow({
    priceuni: "Subtotal - Produtos",
    price: summary.subtotal,
  });
  itemsSheet.addRow({
    priceuni: "Transporte (tbc)",
    price: summary.transport,
  });
  itemsSheet.addRow({
    priceuni: "TOTAL Estimado",
    price: summary.total,
  });

  return workbook.xlsx.writeBuffer();
}

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toText(summary: ReturnType<typeof buildSummary>) {
  const lines = summary.normalized.map(
    (x) => `- ${x.label} | ${x.qty} × ${formatEur(x.priceEur)} = ${formatEur(x.lineTotalEur)}`
  );

  const transportText =
    summary.transport > 0
      ? `\nTransporte: ${formatEur(summary.transport)} (20€ por caixa de 20L; caixas: ${summary.boxes}; litros: ${summary.liters.toFixed(1)}L)`
      : `\nTransporte: 0€ (Pick-up)`;

  return `${lines.join("\n")}\n\n - Produtos: ${formatEur(summary.subtotal)}${transportText}\nTOTAL ESTIMADO: ${formatEur(summary.total)}`;
}

function toHtml(summary: ReturnType<typeof buildSummary>) {
  const rows = summary.normalized
    .map(
      (x) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(x.id)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(x.label)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${x.qty}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(formatEur(x.priceEur))}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(formatEur(x.priceEur * x.qty))}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.4;color:#111;">
    <h2 style="margin:0 0 10px;">Resumo da reserva</h2>

    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#fafafa;">
        <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;">#</th>
          <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;">Produto</th>
          <th style="padding:10px;text-align:center;border-bottom:1px solid #eee;">Qtd</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #eee;">Preço Uni.</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #eee;">Preço Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:12px;text-align:right;">Subtotal - Produtos</td>
          <td style="padding:12px;text-align:right;"><strong>${escapeHtml(formatEur(summary.subtotal))}</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="padding:12px;text-align:right;">Transporte (tbc)</td>
          <td style="padding:12px;text-align:right;"><strong>${escapeHtml(formatEur(20))}</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="padding:12px;text-align:right;"><strong>TOTAL ESTIMADO</strong></td>
          <td style="padding:12px;text-align:right;"><strong>${escapeHtml(formatEur(summary.total))}</strong></td>
        </tr>
      </tfoot>
    </table>
  </div>`;
}

/* ================= API ================= */

export async function POST(req: Request) {
  const ip =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "unknown";

  if (!rateLimit(ip))
    return new NextResponse(
      "Too many requests. Try later.",
      { status: 429 }
    );

  const isClient: boolean = true

  const body = (await req.json()) as Body;

  if (!body?.agree)
    return new NextResponse(
      "Missing agreement checkbox",
      { status: 400 }
    );

  if (!body?.email)
    return new NextResponse(
      "Missing email",
      { status: 400 }
    );

  if (!body?.lines?.length)
    return new NextResponse(
      "Empty cart",
      { status: 400 }
    );

  const transporter =
    nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  const ownerEmail =
    process.env.OWNER_EMAIL;

  const wantsTransport =
    Boolean(body.wantsTransport);

  const summary = buildSummary(
    body.lines,
    wantsTransport
  );

  /* ===== BUILD EXCEL ===== */
  const excelBufferClient = await buildExcel(
    body,
    summary,
    true
  );

  const excelBufferNotClient = await buildExcel(
    body,
    summary,
    false
  );

  const textSummary = toText(summary);
  const htmlSummary = toHtml(summary);
  const createdAt = new Date();

  const subjectOwner = `Nova reserva - ${body.name} (${formatEur(
    summary.total
  )})`;

  const subjectUser = `Confirmação da tua reserva - Produtos Portugueses na Dinamarca (custo dos produtos: ${formatEur(
    summary.subtotal
  )}+" Transporte")`;

  const notesText = body.notes?.trim() ? `\nNotas do cliente: ${body.notes.trim()}\n` : "";

  const ownerText =
    `Nova reserva recebida:

Nome: ${body.name}
Email: ${body.email}
Morada: ${body.address}
${notesText}
`;

  const userText =
    `Olá ${body.name},

Recebemos a tua reserva ✅, e obrigado por participares nesta iniciativa comunitária.

Telefone para contacto:
${body.address}
${notesText}
Resumo:
${textSummary}

Obrigado,
Inês
`;

  /* ===== SEND OWNER ===== */
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: ownerEmail,
    replyTo: body.email,
    subject: subjectOwner,
    text: ownerText,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111;">
        <h2>Nova reserva recebida</h2>
        <p><strong>Nome:</strong> ${escapeHtml(body.name)}<br/>
           <strong>Email:</strong> ${escapeHtml(body.email)}<br/>
           <strong>Telefone para contacto:</strong> ${escapeHtml(body.address)}<br/>
           ${body.notes?.trim() ? `<strong>Notas:</strong> ${escapeHtml(body.notes.trim())}` : ""}
        </p>
        ${htmlSummary}
      </div>
    `,
    attachments: [
      {
        filename: "nova_reserva_" + body.name + "_a" + createdAt.toLocaleString("pt-PT") + "_.xlsx",
        content: Buffer.from(excelBufferNotClient),
      },
    ],
  });

  /* ===== SEND USER ===== */
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: body.email,
    subject: subjectUser,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111;">

      <div style="max-width:640px; margin:0 auto; padding:24px; font-family:Arial, Helvetica, sans-serif; color:#111; line-height:1.5;">

      <p style="margin:0 0 16px 0;">Olá <strong>${escapeHtml(body.name)}</strong>,</p>

      <p style="margin:0 0 16px 0;">
        Recebemos a tua reserva ✅
      </p>

        ${body.notes?.trim() ? `<p><strong>Notas:</strong><br/>${escapeHtml(body.notes.trim())}</p>` : ""}

      <hr style="border:none; border-top:1px solid #e5e5e5; margin:16px 0 20px 0;" />

      <h3 style="margin:0 0 8px 0; font-size:16px;">🧾 Próximos passos</h3>
      <p style="margin:0 0 12px 0;">
        Quando tivermos confirmação do próximo transporte, entraremos em contacto contigo para procedermos ao pagamento dos teus produtos e à respetiva compra. Relembra-te que este serviço é comunitário e pessoal e está em teste.
      </p>
      <p style="margin:0 0 12px 0;">
        Após realizarmos as compras, organizamos os teus produtos na(s) caixa(s) de envio e confirmamos o valor final do transporte.
      </p>
      <p style="margin:0 0 12px 0;">
        Nessa altura, enviamos também foto para que possas visualizar o espaço ocupado.
      </p>
      <p style="margin:0 0 16px 0;">
        O pagamento do transporte será solicitado apenas após esta confirmação.<br />
      </p>

      <hr style="border:none; border-top:1px solid #e5e5e5; margin:16px 0 20px 0;" />

      <h3 style="margin:0 0 8px 0; font-size:16px;">🚚 Transporte</h3>
      <p style="margin:0 0 16px 0;">
        Para minimizar o custo de envio, as encomendas são organizadas por caixa e otimizadas conforme o volume total.
      </p>
    
      <hr style="border:none; border-top:1px solid #e5e5e5; margin:16px 0 20px 0;" />

      <h3 style="margin:0 0 8px 0; font-size:16px;">📦 Entrega / Pick-up</h3>
      <p style="margin:0 0 8px 0;">
        Para reduzir o preço de transporte, o levantamento será feito em:
      </p>
      <p style="margin:0 0 12px 0;">
        <strong>Ørestad (Copenhaga)</strong>
      </p>
      <p style="margin:0 0 12px 0;">
        Caso prefiras receber a encomenda em casa, haverá um custo adicional de entrega.
      </p>
      <p style="margin:0 0 16px 0;">
        A morada completa para pick-up será partilhada após confirmação e pagamento da reserva.
      </p>

      <hr style="border:none; border-top:1px solid #e5e5e5; margin:16px 0 20px 0;" />

      <h3 style="margin:0 0 8px 0; font-size:16px;">📞 Contacto</h3>
      <p style="margin:0 0 20px 0;">
        Qualquer dúvida, estamos sempre disponíveis para ajudar através de produtosportuguesesnadinamarca@gmail.com
      </p>

      <hr style="border:none; border-top:1px solid #e5e5e5; margin:16px 0 20px 0;" />

      <p style="margin:0 0 16px 0; font-size:12px; color:#555;">
        Uma vez que este serviço é comunitário e pessoal, não serão emitidas faturas comerciais.
      </p>

      <p style="margin:0;">
        Obrigado,<br />
        <strong>Produtos Portugueses na Dinamarca</strong>
      </p>

    </div>
    `,
    attachments: [
      {
        filename: "nova_reserva_" + body.name + "_a" + createdAt.toLocaleString("pt-PT") + "_.xlsx",
        content: Buffer.from(excelBufferClient),
      },
    ],
  });

  return NextResponse.json({
    ok: true,
    total: summary.total,
  });
}
