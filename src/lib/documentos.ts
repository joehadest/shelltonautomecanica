import { generateId } from "@/lib/utils";
import type { Agendamento } from "@/lib/types";

export type DocumentoTipo = "orcamento" | "recibo";

export interface DocumentoItem {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface DocumentoDraft {
  tipo: DocumentoTipo;
  clienteNome: string;
  telefone: string;
  modelo: string;
  placa: string;
  maoDeObra: DocumentoItem[];
  produtos: DocumentoItem[];
  desconto: number;
  observacoes: string;
}

export const DOCUMENTO_TIPO_LABEL: Record<DocumentoTipo, string> = {
  orcamento: "Orçamento",
  recibo: "Recibo de Fechamento",
};

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseMoneyInput(raw: string): number {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function itemSubtotal(item: DocumentoItem): number {
  return Math.max(0, item.quantidade) * Math.max(0, item.valorUnitario);
}

export function somaItens(itens: DocumentoItem[]): number {
  return itens.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

export function calcularTotais(draft: DocumentoDraft) {
  const subtotalMaoDeObra = somaItens(draft.maoDeObra);
  const subtotalProdutos = somaItens(draft.produtos);
  const subtotal = subtotalMaoDeObra + subtotalProdutos;
  const desconto = Math.max(0, draft.desconto);
  const total = Math.max(0, subtotal - desconto);
  return { subtotalMaoDeObra, subtotalProdutos, subtotal, desconto, total };
}

export function hasDocumentoItens(draft: DocumentoDraft): boolean {
  return (
    draft.maoDeObra.some((i) => i.descricao.trim()) ||
    draft.produtos.some((i) => i.descricao.trim())
  );
}

export function createEmptyItem(descricao = ""): DocumentoItem {
  return {
    id: generateId(),
    descricao,
    quantidade: 1,
    valorUnitario: 0,
  };
}

export function createEmptyDraft(tipo: DocumentoTipo = "orcamento"): DocumentoDraft {
  const observacoesPadrao =
    tipo === "orcamento"
      ? "Orçamento válido por 7 dias. Valores sujeitos a alteração após diagnóstico presencial."
      : "Serviço executado conforme descrito. Garantia de 90 dias para mão de obra.";

  return {
    tipo,
    clienteNome: "",
    telefone: "",
    modelo: "",
    placa: "",
    maoDeObra: [createEmptyItem()],
    produtos: [],
    desconto: 0,
    observacoes: observacoesPadrao,
  };
}

export function draftFromAgendamento(a: Agendamento): DocumentoDraft {
  const tipo: DocumentoTipo =
    a.status === "aprovado" ? "recibo" : "orcamento";

  const observacoesPadrao =
    tipo === "orcamento"
      ? "Orçamento válido por 7 dias. Valores sujeitos a alteração após diagnóstico presencial."
      : "Serviço executado conforme descrito. Garantia de 90 dias para mão de obra.";

  return {
    tipo,
    clienteNome: a.cliente_nome,
    telefone: a.telefone,
    modelo: a.modelo,
    placa: a.placa,
    maoDeObra: [createEmptyItem(a.servico_nome)],
    produtos: [],
    desconto: 0,
    observacoes: a.observacoes?.trim() || observacoesPadrao,
  };
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 13 && digits.startsWith("55")) {
    const local = digits.slice(2);
    if (local.length === 11) {
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
  }
  return phone.trim() || "—";
}

export function normalizeWhatsAppPhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("55")) digits = `55${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Mensagem curta para acompanhar o PDF no WhatsApp. */
export function buildWhatsAppShortMessage(draft: DocumentoDraft): string {
  const tipo =
    draft.tipo === "orcamento" ? "orçamento" : "recibo de fechamento";
  const primeiroNome =
    draft.clienteNome.trim().split(/\s+/)[0] || "cliente";
  const { total } = calcularTotais(draft);

  return [
    `Olá, ${primeiroNome}! 👋`,
    ``,
    `Segue seu *${tipo}* da *Shellton Auto Mecânica*.`,
    ``,
    `💰 *Total: ${formatCurrency(total)}*`,
    ``,
    `📎 O PDF está em anexo nesta conversa.`,
    ``,
    `_Documento informativo — sem valor fiscal._`,
  ].join("\n");
}

/** @deprecated Use PDF + buildWhatsAppShortMessage */
export function buildWhatsAppMessage(draft: DocumentoDraft): string {
  const { subtotal, desconto, total } = calcularTotais(draft);
  const titulo = DOCUMENTO_TIPO_LABEL[draft.tipo].toUpperCase();
  const emoji = draft.tipo === "orcamento" ? "📋" : "🧾";

  const lines: string[] = [
    `${emoji} *${titulo}*`,
    `*SHELLTON AUTO MECÂNICA*`,
    ``,
    `⚠️ _Documento informativo — sem valor fiscal_`,
    ``,
    `👤 *Cliente:* ${draft.clienteNome.trim() || "—"}`,
    `📱 *WhatsApp:* ${draft.telefone.trim() || "—"}`,
  ];

  if (draft.modelo.trim() || draft.placa.trim()) {
    const veiculo = [draft.modelo.trim(), draft.placa.trim().toUpperCase()]
      .filter(Boolean)
      .join(" · ");
    lines.push(`🚗 *Veículo:* ${veiculo}`);
  }

  lines.push(``, `*Mão de obra:*`);
  const maoDeObra = draft.maoDeObra.filter((i) => i.descricao.trim());
  if (maoDeObra.length === 0) {
    lines.push(`• (nenhum serviço informado)`);
  } else {
    for (const item of maoDeObra) {
      const qtd = Math.max(0, item.quantidade);
      const unit = formatCurrency(Math.max(0, item.valorUnitario));
      const sub = formatCurrency(itemSubtotal(item));
      lines.push(`• ${item.descricao.trim()} — ${qtd}x ${unit} = *${sub}*`);
    }
  }

  lines.push(``, `*Produtos / peças:*`);
  const produtos = draft.produtos.filter((i) => i.descricao.trim());
  if (produtos.length === 0) {
    lines.push(`• (nenhum produto informado)`);
  } else {
    for (const item of produtos) {
      const qtd = Math.max(0, item.quantidade);
      const unit = formatCurrency(Math.max(0, item.valorUnitario));
      const sub = formatCurrency(itemSubtotal(item));
      lines.push(`• ${item.descricao.trim()} — ${qtd}x ${unit} = *${sub}*`);
    }
  }

  lines.push(
    ``,
    `*Resumo financeiro:*`,
    `Mão de obra: ${formatCurrency(calcularTotais(draft).subtotalMaoDeObra)}`,
    `Produtos: ${formatCurrency(calcularTotais(draft).subtotalProdutos)}`,
    `Subtotal: ${formatCurrency(subtotal)}`
  );

  if (desconto > 0) {
    lines.push(`Desconto: −${formatCurrency(desconto)}`);
  }

  lines.push(`*Total: ${formatCurrency(total)}*`);

  if (draft.observacoes.trim()) {
    lines.push(``, `📝 *Observações:*`, draft.observacoes.trim());
  }

  lines.push(
    ``,
    `—`,
    `Shellton Auto Mecânica`,
    `_Documento informativo. Não substitui nota fiscal._`
  );

  return lines.join("\n");
}
