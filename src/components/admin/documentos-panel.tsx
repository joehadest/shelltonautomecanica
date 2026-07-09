"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Receipt,
  Phone,
  User,
  Car,
  Plus,
  Trash2,
  Send,
  Search,
  Eye,
  MessageCircle,
  Wrench,
  Inbox,
  FileDown,
  Hammer,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDB } from "@/lib/store";
import { resolveEmpresa } from "@/lib/empresa-defaults";
import { EmpresaConfigCard } from "@/components/admin/empresa-config-card";
import type { ConfiguracaoEmpresa } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import {
  AGENDAMENTO_STATUS_LABEL,
  type Agendamento,
} from "@/lib/types";
import {
  type DocumentoDraft,
  type DocumentoItem,
  type DocumentoTipo,
  DOCUMENTO_TIPO_LABEL,
  buildWhatsAppShortMessage,
  buildWhatsAppUrl,
  calcularTotais,
  createEmptyItem,
  createEmptyDraft,
  draftFromAgendamento,
  formatCurrency,
  formatPhoneDisplay,
  hasDocumentoItens,
  itemSubtotal,
  normalizeWhatsAppPhone,
  somaItens,
} from "@/lib/documentos";
import {
  downloadDocumentoPdf,
  shareDocumentoPdf,
} from "@/lib/documento-pdf";

const MANUAL_ID = "__manual__";

function StatusBadge({ status }: { status: Agendamento["status"] }) {
  const map = {
    pendente: "warning",
    aprovado: "success",
    recusado: "danger",
    em_espera: "warning",
  } as const;
  return (
    <Badge variant={map[status]}>{AGENDAMENTO_STATUS_LABEL[status]}</Badge>
  );
}

function ItemTablePreview({
  titulo,
  itens,
  subtotal,
}: {
  titulo: string;
  itens: DocumentoItem[];
  subtotal: number;
}) {
  const validos = itens.filter((i) => i.descricao.trim());

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
        {titulo}
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-3 py-2 font-semibold">Descrição</th>
              <th className="px-2 py-2 text-center font-semibold">Qtd.</th>
              <th className="px-2 py-2 text-right font-semibold">Unit.</th>
              <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {validos.length === 0 ? (
              <tr className="border-t border-border bg-background">
                <td colSpan={4} className="px-3 py-3 text-muted-foreground">
                  Nenhum item informado.
                </td>
              </tr>
            ) : (
              validos.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-t border-border",
                    idx % 2 === 0 ? "bg-background" : "bg-secondary/30"
                  )}
                >
                  <td className="px-3 py-2 text-foreground">
                    {item.descricao}
                  </td>
                  <td className="px-2 py-2 text-center text-muted-foreground">
                    {item.quantidade}
                  </td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {formatCurrency(item.valorUnitario)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">
                    {formatCurrency(itemSubtotal(item))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/40">
              <td
                colSpan={3}
                className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
              >
                Subtotal {titulo.toLowerCase()}
              </td>
              <td className="px-3 py-2 text-right text-xs font-bold text-foreground">
                {formatCurrency(subtotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function DocumentPreview({
  draft,
  empresa,
}: {
  draft: DocumentoDraft;
  empresa: ConfiguracaoEmpresa;
}) {
  const { subtotalMaoDeObra, subtotalProdutos, subtotal, desconto, total } =
    calcularTotais(draft);

  return (
    <div className="rounded-xl border border-border bg-background p-5 font-mono text-xs leading-relaxed shadow-inner">
      <div className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={empresa.logo_base64 || "/shellton-logo.png"}
              alt="Logo"
              className="size-12 shrink-0 rounded-md bg-white/10 object-contain p-1"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide">
                {empresa.nome_fantasia}
              </p>
              <p className="mt-1 text-[10px] opacity-90">
                {empresa.razao_social}
              </p>
              <p className="mt-0.5 text-[10px] opacity-80">
                CNPJ: {empresa.cnpj}
                {empresa.inscricao_estadual &&
                  ` · IE: ${empresa.inscricao_estadual}`}
              </p>
              <p className="mt-0.5 text-[10px] opacity-80">
                {[empresa.endereco, empresa.cidade_uf].filter(Boolean).join(" — ")}
              </p>
              <p className="mt-0.5 text-[10px] opacity-80">
                {[empresa.telefone, empresa.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase">
              {DOCUMENTO_TIPO_LABEL[draft.tipo]}
            </p>
            <p className="mt-1 text-[9px] opacity-80">
              Documento informativo
              <br />
              sem valor fiscal
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-muted-foreground">
        <p>
          <span className="text-foreground">Cliente:</span>{" "}
          {draft.clienteNome || "—"}
        </p>
        <p>
          <span className="text-foreground">WhatsApp:</span>{" "}
          {draft.telefone || "—"}
        </p>
        {(draft.modelo || draft.placa) && (
          <p>
            <span className="text-foreground">Veículo:</span>{" "}
            {[draft.modelo, draft.placa.toUpperCase()].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <ItemTablePreview
          titulo="Mão de obra"
          itens={draft.maoDeObra}
          subtotal={subtotalMaoDeObra}
        />
        <ItemTablePreview
          titulo="Produtos / peças"
          itens={draft.produtos}
          subtotal={subtotalProdutos}
        />
      </div>

      <div className="mt-4 space-y-1 border-t border-dashed border-border pt-3">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal geral</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Desconto</span>
            <span>−{formatCurrency(desconto)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold text-foreground">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {draft.observacoes.trim() && (
        <div className="mt-4 rounded-lg bg-secondary/40 p-3">
          <p className="text-[10px] font-semibold uppercase text-foreground">
            Observações
          </p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {draft.observacoes}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-dashed border-border pt-4">
        <p className="text-[10px] font-semibold uppercase text-foreground">
          Assinaturas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-dashed border-border p-3 text-center">
            <div className="flex h-14 items-center justify-center text-[10px] text-muted-foreground">
              Espaço para assinatura do cliente
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <p className="text-[10px] font-medium text-foreground">
                {draft.clienteNome || "Cliente"}
              </p>
              <p className="text-[9px] text-muted-foreground">
                Assinatura do cliente
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="flex h-14 items-center justify-center">
              {empresa.assinatura_base64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={empresa.assinatura_base64}
                  alt="Assinatura empresa"
                  className="max-h-12 max-w-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Sem assinatura cadastrada
                </span>
              )}
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <p className="text-[10px] font-medium text-foreground">
                {empresa.nome_fantasia}
              </p>
              {empresa.assinatura_responsavel && (
                <p className="text-[9px] text-muted-foreground">
                  {empresa.assinatura_responsavel}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ItemLista = "maoDeObra" | "produtos";

function ItensEditor({
  titulo,
  descricao,
  icon: Icon,
  itens,
  onAdd,
  onUpdate,
  onRemove,
  placeholder,
  allowEmpty,
}: {
  titulo: string;
  descricao: string;
  icon: typeof Hammer;
  itens: DocumentoItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<DocumentoItem>) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  allowEmpty?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-primary" />
            {titulo}
          </CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {itens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nenhum item. Clique em Adicionar.
          </p>
        ) : (
          itens.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-secondary/20 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {titulo} {idx + 1}
                </span>
                {(allowEmpty || itens.length > 1) && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => onRemove(item.id)}
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder={placeholder}
                  value={item.descricao}
                  onChange={(e) =>
                    onUpdate(item.id, { descricao: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Qtd.</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={item.quantidade}
                      onChange={(e) =>
                        onUpdate(item.id, {
                          quantidade: parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor unit. (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.valorUnitario || ""}
                      onChange={(e) =>
                        onUpdate(item.id, {
                          valorUnitario: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  Subtotal:{" "}
                  <strong className="text-foreground">
                    {formatCurrency(itemSubtotal(item))}
                  </strong>
                </p>
              </div>
            </div>
          ))
        )}
        {itens.length > 0 && (
          <p className="text-right text-sm font-medium text-foreground">
            Subtotal {titulo.toLowerCase()}:{" "}
            <span className="text-primary">
              {formatCurrency(somaItens(itens))}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentosPanel() {
  const { agendamentos, empresaConfig } = useDB();
  const empresa = resolveEmpresa(empresaConfig);
  const [busca, setBusca] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DocumentoDraft | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const elegiveis = useMemo(
    () =>
      [...agendamentos]
        .filter((a) => a.status !== "recusado")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [agendamentos]
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return elegiveis;
    return elegiveis.filter(
      (a) =>
        a.cliente_nome.toLowerCase().includes(q) ||
        a.telefone.includes(q) ||
        a.modelo.toLowerCase().includes(q) ||
        a.placa.toLowerCase().includes(q) ||
        a.servico_nome.toLowerCase().includes(q)
    );
  }, [elegiveis, busca]);

  const isManual = selectedId === MANUAL_ID;

  function novoManual(tipo: DocumentoTipo = "orcamento") {
    setSelectedId(MANUAL_ID);
    setDraft(createEmptyDraft(tipo));
  }

  function selecionar(a: Agendamento) {
    setSelectedId(a.id);
    setDraft(draftFromAgendamento(a));
  }

  function updateDraft<K extends keyof DocumentoDraft>(
    key: K,
    value: DocumentoDraft[K]
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function updateItem(
    lista: ItemLista,
    id: string,
    patch: Partial<DocumentoItem>
  ) {
    setDraft((d) =>
      d
        ? {
            ...d,
            [lista]: d[lista].map((i) =>
              i.id === id ? { ...i, ...patch } : i
            ),
          }
        : d
    );
  }

  function addItem(lista: ItemLista) {
    setDraft((d) =>
      d ? { ...d, [lista]: [...d[lista], createEmptyItem()] } : d
    );
  }

  function removeItem(lista: ItemLista, id: string) {
    setDraft((d) =>
      d ? { ...d, [lista]: d[lista].filter((i) => i.id !== id) } : d
    );
  }

  function validarDraft(): boolean {
    if (!draft) return false;
    if (!draft.clienteNome.trim()) {
      toast.error("Informe o nome do cliente.");
      return false;
    }
    if (!normalizeWhatsAppPhone(draft.telefone)) {
      toast.error("WhatsApp inválido. Verifique o número do cliente.");
      return false;
    }
    if (!hasDocumentoItens(draft)) {
      toast.error("Adicione pelo menos um item em mão de obra ou produtos.");
      return false;
    }
    return true;
  }

  async function baixarPdf() {
    if (!draft || !validarDraft()) return;
    try {
      await downloadDocumentoPdf(draft, empresa);
      toast.success("PDF baixado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  }

  async function enviarWhatsApp() {
    if (!draft || !validarDraft()) return;

    try {
      const modo = await shareDocumentoPdf(draft, empresa);

      if (modo === "shared") {
        toast.success("PDF compartilhado. Escolha o WhatsApp na lista.");
        return;
      }

      const url = buildWhatsAppUrl(
        draft.telefone,
        buildWhatsAppShortMessage(draft)
      );
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      toast.success("PDF baixado. Anexe o arquivo na conversa do WhatsApp.", {
        description: "O WhatsApp foi aberto com a mensagem de acompanhamento.",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Não foi possível gerar ou enviar o PDF.");
    }
  }

  const totais = draft ? calcularTotais(draft) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Orçamentos e Recibos
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecione um pedido do site ou crie um orçamento manual para clientes
          avulsos. Gere o PDF e envie pelo WhatsApp.
        </p>
      </div>

      <EmpresaConfigCard />

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">
        {/* Lista de pedidos */}
        <div className="space-y-3">
          <div className="grid gap-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => novoManual("orcamento")}
            >
              <Plus />
              Novo orçamento manual
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => novoManual("recibo")}
            >
              <Receipt className="size-4" />
              Novo recibo manual
            </Button>
          </div>

          {isManual && draft && (
            <button
              type="button"
              onClick={() => novoManual(draft.tipo)}
              className="w-full cursor-pointer rounded-xl border border-primary bg-primary/5 p-4 text-left ring-1 ring-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground">
                  {draft.clienteNome.trim() || "Documento avulso"}
                </p>
                <Badge variant="secondary">Manual</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {DOCUMENTO_TIPO_LABEL[draft.tipo]} · preencha os dados ao lado
              </p>
            </button>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, placa..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {filtrados.length === 0 && !isManual ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {elegiveis.length === 0
                  ? "Nenhum pedido pelo site ainda. Use os botões acima para criar um documento avulso."
                  : "Nenhum resultado para a busca."}
              </p>
            </Card>
          ) : filtrados.length > 0 ? (
            <div className="max-h-[calc(100vh-280px)] space-y-2 overflow-y-auto pr-1">
              {filtrados.map((a) => {
                const active = selectedId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selecionar(a)}
                    className={cn(
                      "w-full cursor-pointer rounded-xl border p-4 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {a.cliente_nome}
                      </p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5 text-primary" />
                      {a.telefone}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wrench className="size-3.5 text-primary" />
                      {a.servico_nome}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {a.modelo} · {a.placa.toUpperCase()} ·{" "}
                      {formatDateTime(a.data_hora)}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {elegiveis.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground">
              Pedidos feitos pelo site
            </p>
          )}
        </div>

        {/* Gerador de documento */}
        {!draft ? (
          <Card className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-10 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Selecione um pedido ou crie um orçamento/recibo manual.
            </p>
            <Button type="button" onClick={() => novoManual("orcamento")}>
              <Plus />
              Criar orçamento manual
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {isManual && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Documento avulso
                </p>
                <p className="mt-0.5 text-xs">
                  Preencha os dados do cliente e os itens abaixo. Não é
                  necessário agendamento pelo site.
                </p>
              </div>
            )}
            {/* Tipo de documento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tipo de documento</CardTitle>
                <CardDescription>
                  Orçamento para aprovação prévia; recibo após conclusão do
                  serviço.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "orcamento" as DocumentoTipo, icon: FileText },
                      { id: "recibo" as DocumentoTipo, icon: Receipt },
                    ] as const
                  ).map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateDraft("tipo", id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                        draft.tipo === id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <Icon className="size-4" />
                      {DOCUMENTO_TIPO_LABEL[id]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              {/* Formulário */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dados do cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="doc-nome">Nome</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="doc-nome"
                          className="pl-9"
                          value={draft.clienteNome}
                          onChange={(e) =>
                            updateDraft("clienteNome", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-tel">WhatsApp</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="doc-tel"
                          type="tel"
                          className="pl-9"
                          value={draft.telefone}
                          onChange={(e) =>
                            updateDraft("telefone", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="doc-modelo">Modelo</Label>
                        <div className="relative">
                          <Car className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="doc-modelo"
                            className="pl-9"
                            value={draft.modelo}
                            onChange={(e) =>
                              updateDraft("modelo", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-placa">Placa</Label>
                        <Input
                          id="doc-placa"
                          className="uppercase"
                          value={draft.placa}
                          onChange={(e) =>
                            updateDraft("placa", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ItensEditor
                  titulo="Mão de obra"
                  descricao="Serviços, diagnósticos e trabalhos executados."
                  icon={Hammer}
                  itens={draft.maoDeObra}
                  onAdd={() => addItem("maoDeObra")}
                  onUpdate={(id, patch) => updateItem("maoDeObra", id, patch)}
                  onRemove={(id) => removeItem("maoDeObra", id)}
                  placeholder="Ex.: Troca de óleo, alinhamento, revisão"
                />

                <ItensEditor
                  titulo="Produtos / peças"
                  descricao="Peças, fluidos e materiais utilizados."
                  icon={Package}
                  itens={draft.produtos}
                  onAdd={() => addItem("produtos")}
                  onUpdate={(id, patch) => updateItem("produtos", id, patch)}
                  onRemove={(id) => removeItem("produtos", id)}
                  placeholder="Ex.: Filtro de óleo, pastilha de freio"
                  allowEmpty
                />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resumo financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="doc-desconto">Desconto (R$)</Label>
                      <Input
                        id="doc-desconto"
                        type="number"
                        min={0}
                        step={0.01}
                        value={draft.desconto || ""}
                        onChange={(e) =>
                          updateDraft(
                            "desconto",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    {totais && (
                      <div className="rounded-lg border border-border bg-card/60 p-4 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Mão de obra</span>
                          <span>{formatCurrency(totais.subtotalMaoDeObra)}</span>
                        </div>
                        <div className="mt-1 flex justify-between text-muted-foreground">
                          <span>Produtos / peças</span>
                          <span>{formatCurrency(totais.subtotalProdutos)}</span>
                        </div>
                        <div className="mt-1 flex justify-between border-t border-border/60 pt-1 text-muted-foreground">
                          <span>Subtotal geral</span>
                          <span>{formatCurrency(totais.subtotal)}</span>
                        </div>
                        {totais.desconto > 0 && (
                          <div className="mt-1 flex justify-between text-muted-foreground">
                            <span>Desconto</span>
                            <span>−{formatCurrency(totais.desconto)}</span>
                          </div>
                        )}
                        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                          <span>Total</span>
                          <span className="text-primary">
                            {formatCurrency(totais.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Observações</CardTitle>
                    <CardDescription>
                      Validade do orçamento, garantia, condições de pagamento,
                      etc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      rows={4}
                      value={draft.observacoes}
                      onChange={(e) =>
                        updateDraft("observacoes", e.target.value)
                      }
                      placeholder="Ex.: Orçamento válido por 7 dias. Garantia de 90 dias na mão de obra."
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Pré-visualização + envio */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base">Pré-visualização</CardTitle>
                      <CardDescription>
                        Prévia do PDF em formato de planilha.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPreview((v) => !v)}
                    >
                      <Eye className="size-4" />
                      {showPreview ? "Ocultar" : "Mostrar"}
                    </Button>
                  </CardHeader>
                  {showPreview && (
                    <CardContent>
                      <DocumentPreview draft={draft} empresa={empresa} />
                    </CardContent>
                  )}
                </Card>

                <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.03] to-transparent">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20 sm:size-12">
                          <MessageCircle className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-sm font-semibold leading-snug text-foreground">
                            Enviar para{" "}
                            <span className="break-all font-mono text-primary sm:break-normal">
                              {formatPhoneDisplay(draft.telefone)}
                            </span>
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Gera um PDF em formato de planilha. No celular,
                            compartilhe direto no WhatsApp; no computador, o
                            arquivo é baixado para você anexar.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-sm"
                          onClick={() => void baixarPdf()}
                        >
                          <FileDown className="size-4 shrink-0" />
                          Baixar PDF
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-sm leading-snug sm:min-h-[3rem]"
                          onClick={() => void enviarWhatsApp()}
                        >
                          <Send className="size-4 shrink-0" />
                          <span className="sm:hidden">Enviar PDF no WhatsApp</span>
                          <span className="hidden sm:inline">
                            Enviar PDF no WhatsApp
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
