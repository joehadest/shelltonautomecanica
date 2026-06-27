import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WebhookBody {
  type?: string;
  table?: string;
  record?: {
    cliente_nome?: string;
    servico_nome?: string;
    modelo?: string;
    status?: string;
  };
  // Campos livres caso seja chamado manualmente
  title?: string;
  body?: string;
}

export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const provided =
    request.headers.get("x-webhook-secret") ??
    new URL(request.url).searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let payload: WebhookBody;
  try {
    payload = (await request.json()) as WebhookBody;
  } catch {
    payload = {};
  }

  // Monta a mensagem a partir do novo agendamento (ou de campos manuais).
  let title = payload.title ?? "Novo agendamento";
  let body = payload.body ?? "Você recebeu uma nova solicitação.";

  if (payload.record) {
    const r = payload.record;
    const nome = r.cliente_nome ?? "Cliente";
    const servico = r.servico_nome ? ` · ${r.servico_nome}` : "";
    const modelo = r.modelo ? ` (${r.modelo})` : "";
    title = "Novo agendamento recebido";
    body = `${nome}${modelo}${servico}`;
  }

  try {
    const result = await sendPushToAll({
      title,
      body,
      url: "/admin/dashboard",
      tag: "shellton-agendamento",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao enviar push";
    console.error("/api/push/notify:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
