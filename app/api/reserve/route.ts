import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { formatEur, BOX_CAPACITY_LITERS, SHIPPING_EUR_PER_BOX } from "@/app/data/catalog";

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

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildSummary(lines: CartLine[], wantsTransport: boolean) {
  const normalized = lines.map((l) => ({
    label: [l.name, l.unitLabel].filter(Boolean).join(" - "),
    qty: l.qty,
    priceEur: l.priceEur,
    lineTotalEur: l.priceEur * l.qty,
    volumeLiters: l.volumeLiters,
    id: l.itemId,
  }));

  const liters = lines.reduce((acc, l) => acc + (l.volumeLiters ?? 0) * l.qty, 0);
  const subtotal = normalized.reduce((acc, x) => acc + x.lineTotalEur, 0);
  const boxes = liters > 0 ? Math.ceil(liters / BOX_CAPACITY_LITERS) : 0;
  const transport = wantsTransport ? boxes * SHIPPING_EUR_PER_BOX : 0;
  const total = subtotal + transport;

  return { normalized, subtotal, liters, boxes, transport, total };
}

function toText(summary: ReturnType<typeof buildSummary>) {
  const lines = summary.normalized.map(
    (x) => `- ${x.label} | ${x.qty} × ${formatEur(x.priceEur)} = ${formatEur(x.lineTotalEur)}`
  );

  const transportText =
    summary.transport > 0
      ? `\nTransporte: ${formatEur(summary.transport)} (20€ por caixa de 20L; caixas: ${summary.boxes}; litros: ${summary.liters.toFixed(1)}L)`
      : `\nTransporte: 0€ (Pick-up)`;

  return `${lines.join("\n")}\n\nSubtotal: ${formatEur(summary.subtotal)}${transportText}\nTOTAL ESTIMADO: ${formatEur(summary.total)}`;
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
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;"><strong>${escapeHtml(formatEur(x.lineTotalEur))}</strong></td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.4;color:#111;">
    <h2 style="margin:0 0 10px;">Resumo da reserva</h2>
    <p style="margin:0 0 14px;color:#444;">
      Isto é uma <strong>reserva</strong> (sem pagamento online). Vamos confirmar detalhes por email.
    </p>

    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#fafafa;">
        <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;">#</th>
          <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;">Artigo</th>
          <th style="padding:10px;text-align:center;border-bottom:1px solid #eee;">Qtd</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #eee;">Preço</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #eee;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:12px;text-align:right;">Subtotal</td>
          <td style="padding:12px;text-align:right;"><strong>${escapeHtml(formatEur(summary.subtotal))}</strong></td>
        </tr>
        <tr>
          <td colspan="3" style="padding:12px;text-align:right;">Transporte</td>
          <td style="padding:12px;text-align:right;"><strong>${escapeHtml(formatEur(summary.transport))}</strong></td>
        </tr>
        <tr>
          <td colspan="3" style="padding:12px;text-align:right;"><strong>TOTAL ESTIMADO</strong></td>
          <td style="padding:12px;text-align:right;"><strong>${escapeHtml(formatEur(summary.total))}</strong></td>
        </tr>
      </tfoot>
    </table>
  </div>`;
}

// Rate limit simples (best-effort)
const rateMap = (globalThis as any).__tdl_rateMap || new Map<string, { count: number; ts: number }>();
(globalThis as any).__tdl_rateMap = rateMap;

function rateLimit(ip: string, limit = 8, windowMs = 10 * 60 * 1000) {
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

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) return new NextResponse("Too many requests. Try later.", { status: 429 });

  const body = (await req.json()) as Body;

  if (!body?.agree) return new NextResponse("Missing agreement checkbox", { status: 400 });
  if (!body?.email) return new NextResponse("Missing email", { status: 400 });
  if (!body?.lines?.length) return new NextResponse("Empty cart", { status: 400 });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const ownerEmail = process.env.OWNER_EMAIL;
  const wantsTransport = Boolean(body.wantsTransport);

  const summary = buildSummary(body.lines, wantsTransport);
  const textSummary = toText(summary);
  const htmlSummary = toHtml(summary);

  const subjectOwner = `Nova reserva - ${body.name} (${formatEur(summary.total)})`;
  const subjectUser = `Confirmação da tua reserva - Terra das Lanchas (${formatEur(summary.total)})`;

  const notesText = body.notes?.trim() ? `\nNotas do cliente: ${body.notes.trim()}\n` : "";

  const ownerText =
`Nova reserva recebida:

Nome: ${body.name}
Email: ${body.email}
Morada: ${body.address}
${notesText}
Resumo:
${textSummary}
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
           <strong>Morada:</strong> ${escapeHtml(body.address)}<br/>
           ${body.notes?.trim() ? `<strong>Notas:</strong> ${escapeHtml(body.notes.trim())}` : ""}
        </p>
        ${htmlSummary}
      </div>
    `,
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: body.email,
    subject: subjectUser,
    text: userText,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111;">
        <p>Olá <strong>${escapeHtml(body.name)}</strong>,</p>
        <p>Recebemos a tua reserva ✅<br/>
        <span style="color:#555;">(Reserva sem pagamento online — vamos confirmar detalhes por email.)</span></p>

        <p><strong>Telefone para contacto:</strong><br/>${escapeHtml(body.address)}</p>
        ${body.notes?.trim() ? `<p><strong>Notas:</strong><br/>${escapeHtml(body.notes.trim())}</p>` : ""}

        ${htmlSummary}

        <p style="margin-top:14px;color:#555;">Obrigado,<br/>Terra das Lanchas</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, total: summary.total });
}
