"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  FileText,
  Receipt,
  ClipboardList,
  Plus,
  Trash2,
  Send,
  Search,
  Eye,
  Inbox,
  FileDown,
  Hammer,
  Package,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDB, useDBLoading } from "@/lib/store";
import { resolveEmpresa } from "@/lib/empresa-defaults";
import { EmpresaConfigCard } from "./empresa-config-card";
import { DocumentoModal } from "./documento-modal";
import { DocumentoPreview } from "./documento-preview";
import { VehicleFields } from "./vehicle-fields";
import { cn, formatDateTime } from "@/lib/utils";
import { currencyToNumber } from "@/lib/masks";
import { AGENDAMENTO_STATUS_LABEL, type Agendamento } from "@/lib/types";
import {
  type DocumentoDraft,
  type DocumentoItem,
  type DocumentoTipo,
  DOCUMENTO_TIPO_LABEL,
  DOCUMENTO_TIPOS,
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
import { downloadDocumentoPdf, shareDocumentoPdf } from "@/lib/documento-pdf";
import styles from "./documentos.module.css";

type ItemLista = "maoDeObra" | "produtos";
type Selection = { id: string; draft: DocumentoDraft };
const MANUAL_ID = "__manual__";
const DOCUMENTO_OPCOES: Record<
  DocumentoTipo,
  {
    icon: LucideIcon;
    label: string;
    hint: string;
    title: string;
    description: string;
    totalLabel: string;
  }
> = {
  orcamento: {
    icon: FileText,
    label: "Orçamento",
    hint: "Antes do serviço",
    title: "Novo orçamento",
    description:
      "Apresente serviços, peças e valores para aprovação do cliente.",
    totalLabel: "do orçamento",
  },
  recibo: {
    icon: Receipt,
    label: "Recibo",
    hint: "Após a conclusão",
    title: "Novo recibo",
    description: "Registre os serviços concluídos e o valor do fechamento.",
    totalLabel: "do recibo",
  },
  nota_servico: {
    icon: ClipboardList,
    label: "Nota de serviço",
    hint: "Serviços realizados",
    title: "Nova nota de serviço",
    description:
      "Detalhe os serviços realizados, as peças utilizadas e os valores.",
    totalLabel: "da nota de serviço",
  },
};

function formatMoneyInput(value: number): string {
  return value > 0
    ? value.toLocaleString("pt-BR", {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <span className={styles.step}>{step}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

function CreateChoice({
  tipo,
  onClick,
}: {
  tipo: DocumentoTipo;
  onClick: () => void;
}) {
  const { icon: Icon, title, description } = DOCUMENTO_OPCOES[tipo];
  return (
    <button type="button" className={styles.createCard} onClick={onClick}>
      <span className={styles.createIcon}>
        <Icon size={24} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span>
        Criar documento <ArrowRight size={16} />
      </span>
    </button>
  );
}

function ItensEditor({
  title,
  description,
  icon: Icon,
  items,
  onAdd,
  onUpdate,
  onRemove,
  placeholder,
  focusItem,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: DocumentoItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<DocumentoItem>) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  focusItem?: string;
}) {
  const itemIds = items.map((item) => item.id).join(",");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, formatMoneyInput(item.valorUnitario)]),
    ),
  );
  const [syncedIds, setSyncedIds] = useState(itemIds);
  if (itemIds !== syncedIds) {
    setSyncedIds(itemIds);
    setValues((current) =>
      Object.fromEntries(
        items.map((item) => [
          item.id,
          current[item.id] ?? formatMoneyInput(item.valorUnitario),
        ]),
      ),
    );
  }
  useEffect(() => {
    if (!focusItem) return;
    const field = document.getElementById(`descricao-${focusItem}`);
    field?.focus({ preventScroll: true });
    field?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
  }, [focusItem]);

  return (
    <section>
      <div className={styles.sectionTop}>
        <div>
          <h3>
            <Icon size={17} />
            {title}
          </h3>
          <p>{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className={styles.action}
          onClick={onAdd}
          aria-label={`Adicionar ${title.toLowerCase()}`}
        >
          <Plus />
          Adicionar
        </Button>
      </div>
      {items.length === 0 ? (
        <div className={styles.empty}>
          <Icon size={22} />
          <p>
            Nenhum item adicionado.
            <br />
            Use Adicionar para incluir {title.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className={styles.itemList}>
          {items.map((item, index) => (
            <div className={styles.item} key={item.id}>
              <div className={styles.itemHeading}>
                <span>ITEM {String(index + 1).padStart(2, "0")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={styles.removeItem}
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remover ${title.toLowerCase()} ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className={styles.field}>
                <Label htmlFor={`descricao-${item.id}`}>Descrição</Label>
                <Input
                  id={`descricao-${item.id}`}
                  value={item.descricao}
                  placeholder={placeholder}
                  onChange={(event) =>
                    onUpdate(item.id, { descricao: event.target.value })
                  }
                />
              </div>
              <div className={styles.itemValues}>
                <div className={styles.field}>
                  <Label htmlFor={`quantidade-${item.id}`}>Quantidade</Label>
                  <MaskedInput
                    id={`quantidade-${item.id}`}
                    mask="digits"
                    maxLength={4}
                    value={item.quantidade > 0 ? String(item.quantidade) : ""}
                    placeholder="1"
                    onValueChange={(value) =>
                      onUpdate(item.id, {
                        quantidade:
                          value === ""
                            ? 0
                            : Math.max(0, parseInt(value, 10) || 0),
                      })
                    }
                    onBlur={(event) => {
                      if (!Number(event.target.value))
                        onUpdate(item.id, { quantidade: 1 });
                    }}
                  />
                </div>
                <div className={styles.field}>
                  <Label htmlFor={`valor-${item.id}`}>
                    Valor unitário (R$)
                  </Label>
                  <MaskedInput
                    id={`valor-${item.id}`}
                    mask="currency"
                    placeholder="0,00"
                    value={
                      values[item.id] ?? formatMoneyInput(item.valorUnitario)
                    }
                    onValueChange={(value) => {
                      setValues((current) => ({
                        ...current,
                        [item.id]: value,
                      }));
                      onUpdate(item.id, {
                        valorUnitario: currencyToNumber(value),
                      });
                    }}
                    onBlur={() =>
                      setValues((current) => ({
                        ...current,
                        [item.id]: formatMoneyInput(
                          currencyToNumber(current[item.id] ?? ""),
                        ),
                      }))
                    }
                  />
                </div>
              </div>
              <div className={styles.itemTotal}>
                <span>Subtotal do item</span>
                <strong>{formatCurrency(itemSubtotal(item))}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className={styles.sectionTotal}>
          <span>Total de {title.toLowerCase()}</span>
          <strong>{formatCurrency(somaItens(items))}</strong>
        </div>
      )}
    </section>
  );
}

export function DocumentosPanel() {
  const { agendamentos, empresaConfig } = useDB();
  const loading = useDBLoading();
  const empresa = resolveEmpresa(empresaConfig);
  const [draft, setDraft] = useState<DocumentoDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftRevision, setDraftRevision] = useState(0);
  const [baseline, setBaseline] = useState("");
  const [search, setSearch] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, setPending] = useState<Selection | null>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const busyRef = useRef(false);
  const [focusItem, setFocusItem] = useState<{
    list: ItemLista;
    id: string;
  } | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const dirty = !!draft && JSON.stringify(draft) !== baseline;

  const eligible = useMemo(
    () =>
      [...agendamentos]
        .filter((item) => item.status !== "recusado")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [agendamentos],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const digits = query.replace(/\D/g, "");
    return eligible.filter(
      (item) =>
        [
          item.cliente_nome,
          item.modelo,
          item.placa,
          item.servico_nome,
          item.telefone,
        ].some((value) => value.toLocaleLowerCase("pt-BR").includes(query)) ||
        (!!digits &&
          /^[-+().\s\d]+$/.test(query) &&
          item.telefone.replace(/\D/g, "").includes(digits)),
    );
  }, [eligible, search]);

  function activate(selection: Selection) {
    setDraftRevision((revision) => revision + 1);
    setSelectedId(selection.id);
    setDraft(selection.draft);
    setBaseline(JSON.stringify(selection.draft));
    setDiscountInput(formatMoneyInput(selection.draft.desconto));
    setFocusItem(null);
    setPending(null);
    setSourceOpen(false);
    setPreviewOpen(false);
  }

  function requestSelection(selection: Selection) {
    setSourceOpen(false);
    if (dirty) setPending(selection);
    else activate(selection);
  }
  function newManual(tipo: DocumentoTipo) {
    requestSelection({ id: MANUAL_ID, draft: createEmptyDraft(tipo) });
  }
  function selectOrder(order: Agendamento) {
    if (selectedId === order.id) {
      setSourceOpen(false);
      return;
    }
    requestSelection({ id: order.id, draft: draftFromAgendamento(order) });
  }
  function updateDraft<K extends keyof DocumentoDraft>(
    key: K,
    value: DocumentoDraft[K],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }
  function updateItem(
    list: ItemLista,
    id: string,
    patch: Partial<DocumentoItem>,
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            [list]: current[list].map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  }
  function addItem(list: ItemLista) {
    const item = createEmptyItem();
    setFocusItem({ list, id: item.id });
    setDraft((current) =>
      current ? { ...current, [list]: [...current[list], item] } : current,
    );
  }
  function removeItem(list: ItemLista, id: string) {
    setDraft((current) =>
      current
        ? { ...current, [list]: current[list].filter((item) => item.id !== id) }
        : current,
    );
  }

  function validate(): boolean {
    if (!draft) return false;
    if (!draft.clienteNome.trim()) {
      toast.error("Informe o nome do cliente.");
      setPreviewOpen(false);
      document.getElementById("doc-nome")?.focus();
      return false;
    }
    if (!hasDocumentoItens(draft)) {
      toast.error("Adicione pelo menos um serviço ou produto com descrição.");
      setPreviewOpen(false);
      return false;
    }
    return true;
  }

  async function exportPdf(mode: "download" | "share") {
    if (busyRef.current || !draft || !validate()) return;
    if (mode === "share" && !normalizeWhatsAppPhone(draft.telefone)) {
      toast.error(
        "Informe o WhatsApp do cliente para enviar. O download do PDF não exige telefone.",
      );
      setPreviewOpen(false);
      document.getElementById("doc-tel")?.focus();
      return;
    }
    busyRef.current = true;
    setBusy(mode);
    try {
      if (mode === "download") {
        await downloadDocumentoPdf(draft, empresa);
        toast.success("PDF baixado com sucesso.");
      } else {
        const result = await shareDocumentoPdf(draft, empresa);
        if (result === "shared")
          toast.success("PDF compartilhado. Escolha o WhatsApp na lista.");
        else {
          const url = buildWhatsAppUrl(
            draft.telefone,
            buildWhatsAppShortMessage(draft),
          );
          const opened = url
            ? window.open(url, "_blank", "noopener,noreferrer")
            : null;
          toast.success(
            "PDF baixado. Anexe o arquivo na conversa do WhatsApp.",
            {
              description: opened
                ? "A mensagem de acompanhamento está pronta."
                : "Se a conversa não abrir, abra o WhatsApp e escolha o cliente.",
            },
          );
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        toast.error(
          "Não foi possível gerar ou compartilhar o PDF. Tente novamente.",
        );
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  const totals = draft ? calcularTotais(draft) : null;
  const validItems = draft
    ? [...draft.maoDeObra, ...draft.produtos].filter((item) =>
        item.descricao.trim(),
      ).length
    : 0;
  const exportButtons = (
    <div className={styles.exportButtons}>
      <Button
        type="button"
        onClick={() => void exportPdf("download")}
        disabled={!!busy}
      >
        {busy === "download" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <FileDown />
        )}{" "}
        {busy === "download" ? "Gerando PDF..." : "Baixar PDF"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => void exportPdf("share")}
        disabled={!!busy}
      >
        {busy === "share" ? <Loader2 className="animate-spin" /> : <Send />}{" "}
        {busy === "share" ? "Preparando envio..." : "Enviar pelo WhatsApp"}
      </Button>
    </div>
  );

  const DocumentoIcon = draft ? DOCUMENTO_OPCOES[draft.tipo].icon : FileText;

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>DOCUMENTOS · SHELLTON</p>
          <h1>Documentos da oficina</h1>
          <p>
            Orçamentos, recibos e notas de serviço. Organize os valores e
            entregue um documento claro ao cliente.
          </p>
        </div>
        <div className={styles.headerActions}>
          <EmpresaConfigCard />
          <Button
            type="button"
            className={styles.action}
            disabled={!!busy}
            onClick={() => setSourceOpen(true)}
          >
            <Plus />
            Novo documento
          </Button>
        </div>
      </header>

      {!draft ? (
        <section className={cn(styles.panel, styles.landing)}>
          <div className={styles.landingIntro}>
            <span className={styles.createIcon} style={{ marginBottom: 20 }}>
              <FileText size={24} />
            </span>
            <h2>Seu próximo documento começa aqui.</h2>
            <p>
              Escolha o tipo de documento e preencha os dados do cliente. Você
              também pode aproveitar um pedido recebido pelo site.
            </p>
          </div>
          <div className={styles.createGrid}>
            {DOCUMENTO_TIPOS.map((tipo) => (
              <CreateChoice
                key={tipo}
                tipo={tipo}
                onClick={() => newManual(tipo)}
              />
            ))}
          </div>
          <div className={styles.landingFooter}>
            <p>
              Já tem um agendamento?
              <br />
              Os dados do pedido podem ser preenchidos automaticamente.
            </p>
            <Button
              type="button"
              variant="outline"
              className={styles.action}
              onClick={() => setSourceOpen(true)}
            >
              <Inbox />
              Usar pedido do site
              <ArrowRight />
            </Button>
          </div>
        </section>
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.documentIdentity}>
              <DocumentoIcon size={22} />
              <div>
                <strong>
                  {draft.clienteNome.trim() || "Documento em edição"}
                </strong>
                <p>
                  {DOCUMENTO_TIPO_LABEL[draft.tipo]} ·{" "}
                  {selectedId === MANUAL_ID
                    ? "Cliente avulso"
                    : "Pedido do site"}
                </p>
              </div>
            </div>
            <div className={styles.toolbarActions}>
              <Button
                type="button"
                variant="ghost"
                className={styles.action}
                disabled={!!busy}
                onClick={() => setSourceOpen(true)}
              >
                <ArrowLeftRight />
                Trocar documento
              </Button>
              <Button
                type="button"
                variant="outline"
                className={styles.action}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye />
                Prévia do PDF
              </Button>
            </div>
          </div>
          <div className={styles.workspace}>
            <div className={styles.editor}>
              <FormSection
                step="01"
                title="Dados do documento"
                description="Identifique o cliente e o veículo atendido."
              >
                <div
                  className={styles.typePicker}
                  role="group"
                  aria-label="Tipo de documento"
                >
                  {DOCUMENTO_TIPOS.map((id) => {
                    const { icon: Icon, label, hint } = DOCUMENTO_OPCOES[id];
                    return (
                      <button
                        type="button"
                        key={id}
                        className={styles.typeOption}
                        aria-pressed={draft.tipo === id}
                        onClick={() => updateDraft("tipo", id)}
                      >
                        <Icon size={20} />
                        <span>
                          <strong>{label}</strong>
                          <small>{hint}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.divider} />
                <section>
                  <h3 className={styles.sectionLabel}>Cliente</h3>
                  <div className={styles.fieldGrid}>
                    <div className={cn(styles.field, styles.fullWidth)}>
                      <Label htmlFor="doc-nome">
                        Nome do cliente{" "}
                        <span aria-hidden="true" className="text-primary">
                          *
                        </span>
                      </Label>
                      <Input
                        id="doc-nome"
                        autoComplete="name"
                        placeholder="Nome completo ou razão social"
                        value={draft.clienteNome}
                        onChange={(event) =>
                          updateDraft("clienteNome", event.target.value)
                        }
                        aria-required="true"
                      />
                    </div>
                    <div className={styles.field}>
                      <Label htmlFor="doc-cpf-cnpj">
                        CPF/CNPJ{" "}
                        <span className="text-muted-foreground font-normal">
                          (opcional)
                        </span>
                      </Label>
                      <MaskedInput
                        id="doc-cpf-cnpj"
                        mask="cpfCnpj"
                        placeholder="CPF ou CNPJ"
                        value={draft.cpfCnpj}
                        onValueChange={(value) => updateDraft("cpfCnpj", value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <Label htmlFor="doc-tel">
                        WhatsApp{" "}
                        <span className="text-muted-foreground font-normal">
                          (opcional)
                        </span>
                      </Label>
                      <MaskedInput
                        id="doc-tel"
                        mask="phone"
                        type="tel"
                        autoComplete="tel-national"
                        placeholder="(00) 00000-0000"
                        value={draft.telefone}
                        onValueChange={(value) =>
                          updateDraft("telefone", value)
                        }
                        aria-describedby="doc-tel-hint"
                      />
                      <p id="doc-tel-hint">
                        Necessário apenas para enviar pelo WhatsApp.
                      </p>
                    </div>
                  </div>
                </section>
                <div className={styles.divider} />
                <section>
                  <h3 className={styles.sectionLabel}>
                    Veículo{" "}
                    <span className="normal-case tracking-normal font-normal">
                      · opcional
                    </span>
                  </h3>
                  <VehicleFields
                    key={draftRevision}
                    value={draft.modelo}
                    selection={draft.veiculo}
                    onChange={(modelo, veiculo) =>
                      setDraft((current) =>
                        current ? { ...current, modelo, veiculo } : current,
                      )
                    }
                  >
                    <div className={styles.field}>
                      <Label htmlFor="doc-placa">Placa</Label>
                      <MaskedInput
                        id="doc-placa"
                        mask="placa"
                        placeholder="ABC1D23"
                        value={draft.placa}
                        onValueChange={(value) => updateDraft("placa", value)}
                      />
                    </div>
                  </VehicleFields>
                </section>
              </FormSection>

              <FormSection
                step="02"
                title="Serviços e produtos"
                description="Separe a mão de obra das peças e materiais utilizados."
              >
                <ItensEditor
                  title="Mão de obra"
                  description="Serviços, diagnósticos e trabalhos executados."
                  icon={Hammer}
                  items={draft.maoDeObra}
                  onAdd={() => addItem("maoDeObra")}
                  onUpdate={(id, patch) => updateItem("maoDeObra", id, patch)}
                  onRemove={(id) => removeItem("maoDeObra", id)}
                  placeholder="Ex.: Troca de óleo e revisão"
                  focusItem={
                    focusItem?.list === "maoDeObra" ? focusItem.id : undefined
                  }
                />
                <div className={styles.divider} />
                <ItensEditor
                  title="Produtos / peças"
                  description="Peças, fluidos e materiais do atendimento."
                  icon={Package}
                  items={draft.produtos}
                  onAdd={() => addItem("produtos")}
                  onUpdate={(id, patch) => updateItem("produtos", id, patch)}
                  onRemove={(id) => removeItem("produtos", id)}
                  placeholder="Ex.: Filtro de óleo"
                  focusItem={
                    focusItem?.list === "produtos" ? focusItem.id : undefined
                  }
                />
              </FormSection>

              <FormSection
                step="03"
                title="Condições e observações"
                description="Finalize o desconto e as informações que o cliente precisa receber."
              >
                <div className={styles.field}>
                  <Label htmlFor="doc-desconto">Desconto (R$)</Label>
                  <MaskedInput
                    id="doc-desconto"
                    mask="currency"
                    placeholder="0,00"
                    value={discountInput}
                    onValueChange={(value) => {
                      setDiscountInput(value);
                      updateDraft("desconto", currencyToNumber(value));
                    }}
                    onBlur={() =>
                      setDiscountInput(formatMoneyInput(draft.desconto))
                    }
                    aria-describedby="discount-hint"
                  />
                  <p id="discount-hint">
                    O desconto é aplicado ao total de serviços e produtos.
                  </p>
                  {totals && totals.desconto > totals.subtotal && (
                    <p className="text-amber-400" role="status">
                      O desconto supera o subtotal. O total do documento será R$
                      0,00.
                    </p>
                  )}
                </div>
                <div className={styles.field}>
                  <Label htmlFor="doc-obs">
                    Observações{" "}
                    <span className="text-muted-foreground font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Textarea
                    id="doc-obs"
                    rows={4}
                    placeholder={
                      draft.tipo === "orcamento"
                        ? "Validade do orçamento, garantia, condições de pagamento..."
                        : "Garantia, condições de pagamento e detalhes dos serviços..."
                    }
                    value={draft.observacoes}
                    onChange={(event) =>
                      updateDraft("observacoes", event.target.value)
                    }
                  />
                </div>
              </FormSection>
            </div>

            <aside className={styles.sidebar} aria-label="Resumo e exportação">
              {totals && (
                <section className={cn(styles.panel, styles.summary)}>
                  <div className={styles.summaryHeader}>
                    <h2>Resumo do documento</h2>
                    <span className={styles.tag}>
                      {validItems} {validItems === 1 ? "item" : "itens"}
                    </span>
                  </div>
                  <dl className={styles.summaryRows}>
                    <div>
                      <dt>Mão de obra</dt>
                      <dd>{formatCurrency(totals.subtotalMaoDeObra)}</dd>
                    </div>
                    <div>
                      <dt>Produtos / peças</dt>
                      <dd>{formatCurrency(totals.subtotalProdutos)}</dd>
                    </div>
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatCurrency(totals.subtotal)}</dd>
                    </div>
                    {totals.desconto > 0 && (
                      <div>
                        <dt>Desconto</dt>
                        <dd>− {formatCurrency(totals.desconto)}</dd>
                      </div>
                    )}
                  </dl>
                  <div className={styles.totalBox}>
                    <p>Valor total {DOCUMENTO_OPCOES[draft.tipo].totalLabel}</p>
                    <strong>{formatCurrency(totals.total)}</strong>
                  </div>
                  <div className={styles.checklist}>
                    {[
                      {
                        ready: !!draft.clienteNome.trim(),
                        label: draft.clienteNome.trim()
                          ? "Cliente identificado"
                          : "Preencha o nome do cliente",
                      },
                      {
                        ready: validItems > 0,
                        label:
                          validItems > 0
                            ? "Serviços ou produtos adicionados"
                            : "Adicione um serviço ou produto",
                      },
                    ].map(({ ready, label }) => (
                      <p key={label} data-ready={ready}>
                        {ready ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <Circle size={15} />
                        )}
                        {label}
                      </p>
                    ))}
                  </div>
                  {exportButtons}
                  <p className={styles.exportHint}>
                    {draft.telefone.trim()
                      ? `WhatsApp: ${formatPhoneDisplay(draft.telefone)}. No computador, anexe o PDF baixado à conversa.`
                      : "Você pode baixar o PDF sem telefone. Para enviar pelo WhatsApp, informe o número do cliente."}
                  </p>
                </section>
              )}
              <section className={cn(styles.panel, styles.previewPanel)}>
                <div className={styles.previewHeader}>
                  <div>
                    <h2>Prévia do documento</h2>
                    <p>Confira os dados antes de enviar.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className={styles.action}
                    onClick={() => setPreviewOpen(true)}
                    aria-label="Ampliar prévia"
                  >
                    <Eye />
                  </Button>
                </div>
                <div className={styles.previewBody}>
                  <DocumentoPreview draft={draft} empresa={empresa} />
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      <DocumentoModal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
        title="Novo documento"
        description="Comece do zero ou aproveite os dados de um pedido do site."
      >
        <div className={styles.sourceChoices}>
          {DOCUMENTO_TIPOS.map((tipo) => (
            <CreateChoice
              key={tipo}
              tipo={tipo}
              onClick={() => newManual(tipo)}
            />
          ))}
        </div>
        <div className={styles.ordersHeader}>
          <h3>Pedidos do site</h3>
          <span className={styles.tag}>
            {eligible.length} {eligible.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>
        <div className={styles.search}>
          <Search size={18} />
          <Input
            aria-label="Buscar pedidos"
            placeholder="Nome, placa, serviço ou telefone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {loading ? (
          <div className={styles.empty} role="status">
            <Loader2 size={22} className="animate-spin" />
            <p>Carregando pedidos...</p>
          </div>
        ) : filtered.length ? (
          <div className={styles.orderList}>
            {filtered.map((order) => (
              <button
                className={styles.order}
                type="button"
                key={order.id}
                onClick={() => selectOrder(order)}
              >
                <div>
                  <strong>{order.cliente_nome}</strong>
                  <Badge
                    variant={
                      order.status === "aprovado" ? "success" : "warning"
                    }
                  >
                    {AGENDAMENTO_STATUS_LABEL[order.status]}
                  </Badge>
                </div>
                <p>
                  {order.servico_nome}
                  <br />
                  {[order.modelo, order.placa.toUpperCase()]
                    .filter(Boolean)
                    .join(" · ")}
                  <br />
                  {formatDateTime(order.data_hora)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Inbox size={26} />
            <p>
              {eligible.length
                ? "Nenhum pedido encontrado. Tente outro nome ou placa."
                : "Nenhum pedido disponível. Crie um documento avulso acima."}
            </p>
            {search && (
              <Button
                type="button"
                variant="ghost"
                className={styles.action}
                onClick={() => setSearch("")}
              >
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </DocumentoModal>

      <DocumentoModal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Substituir documento?"
        description="O documento atual tem alterações em edição."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending(null)}
            >
              Continuar editando
            </Button>
            <Button type="button" onClick={() => pending && activate(pending)}>
              Substituir documento
            </Button>
          </>
        }
      >
        <p className={styles.notice}>
          Ao continuar, os dados e itens atuais serão substituídos. Você pode
          voltar à edição para baixar o PDF antes de começar outro documento.
        </p>
      </DocumentoModal>

      <DocumentoModal
        open={previewOpen && !!draft}
        onClose={() => setPreviewOpen(false)}
        title="Prévia do PDF"
        description="Revise o cliente, os itens e o total antes de baixar ou enviar."
        wide
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
            >
              Voltar à edição
            </Button>
            <Button
              type="button"
              disabled={!!busy}
              onClick={() => void exportPdf("download")}
            >
              {busy === "download" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileDown />
              )}
              {busy === "download" ? "Gerando PDF..." : "Baixar PDF"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className={styles.modalPreview}>
            <DocumentoPreview draft={draft} empresa={empresa} />
          </div>
        )}
      </DocumentoModal>
    </div>
  );
}
