"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Radio,
  ArrowRight,
  User,
  Phone,
  Car,
  Wrench,
  Clock,
  ShieldCheck,
  MessageSquare,
  Bell,
  BellRing,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SchedulePicker } from "@/components/agendamento/schedule-picker";
import { useDB, getServicosAtivos, agendamentosApi } from "@/lib/store";
import { resolveAgenda } from "@/lib/agenda-defaults";
import { periodWindowForSlot } from "@/lib/agenda";
import {
  subscribeClientPush,
  isPushSupported,
  isIOS,
  isStandalone,
  type ClientPushSubscription,
} from "@/lib/push-client";
import { cn } from "@/lib/utils";

interface FormState {
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  data_hora: string;
  horario_chegada: string;
  observacoes: string;
}

const EMPTY: FormState = {
  cliente_nome: "",
  telefone: "",
  placa: "",
  modelo: "",
  servico_nome: "",
  data_hora: "",
  horario_chegada: "",
  observacoes: "",
};

export default function AgendamentoPage() {
  const { servicos, agendaConfig } = useDB();
  const ativos = getServicosAtivos(servicos);
  const config = resolveAgenda(agendaConfig);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientPush, setClientPush] = useState<ClientPushSubscription | null>(
    null
  );
  const [pushStatus, setPushStatus] = useState<
    "idle" | "enabling" | "enabled" | "error"
  >("idle");
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const servicoSelecionado = ativos.find((s) => s.titulo === form.servico_nome);
  const duracaoPeriodos = servicoSelecionado?.duracao_periodos ?? 1;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function selecionarServico(titulo: string) {
    setForm((f) => ({
      ...f,
      servico_nome: titulo,
      data_hora: "",
      horario_chegada: "",
    }));
  }

  function selecionarPeriodo(iso: string) {
    const janela = periodWindowForSlot(config, iso);
    setForm((f) => ({
      ...f,
      data_hora: iso,
      horario_chegada: janela?.min ?? "",
    }));
  }

  async function handleEnablePush() {
    // No iOS o push só funciona com o site instalado na tela inicial.
    if (isIOS() && !isStandalone()) {
      setPushStatus("error");
      setPushMsg(
        "No iPhone, toque em Compartilhar → Adicionar à Tela de Início e abra por lá para ativar os avisos."
      );
      return;
    }
    if (!isPushSupported()) {
      setPushStatus("error");
      setPushMsg("Seu aparelho não suporta notificações neste navegador.");
      return;
    }

    setPushStatus("enabling");
    setPushMsg(null);
    try {
      const res = await subscribeClientPush();
      if (res.ok) {
        setClientPush(res.subscription);
        setPushStatus("enabled");
        toast.success("Notificações ativadas!", {
          description: "Você será avisado sobre o andamento do seu serviço.",
        });
      } else {
        setPushStatus("error");
        setPushMsg(res.reason);
      }
    } catch {
      setPushStatus("error");
      setPushMsg("Não foi possível ativar as notificações.");
    }
  }

  const janelaChegada = form.data_hora
    ? periodWindowForSlot(config, form.data_hora)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.cliente_nome ||
      !form.telefone ||
      !form.modelo ||
      !form.servico_nome ||
      !form.data_hora ||
      !form.horario_chegada
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (janelaChegada) {
      const { min, max } = janelaChegada;
      if (form.horario_chegada < min || form.horario_chegada > max) {
        toast.error(
          `O horário de chegada deve ser entre ${min} e ${max} (${janelaChegada.label.toLowerCase()}).`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const inicioISO = new Date(form.data_hora).toISOString();
      const novo = await agendamentosApi.create(
        {
          cliente_nome: form.cliente_nome.trim(),
          telefone: form.telefone.trim(),
          placa: form.placa.trim().toUpperCase(),
          modelo: form.modelo.trim(),
          servico_nome: form.servico_nome,
          data_hora: inicioISO,
          horario_chegada: form.horario_chegada,
          observacoes: form.observacoes.trim() || undefined,
          periodos: duracaoPeriodos,
          agenda_fim: null,
        },
        clientPush
      );
      setSuccess(novo.id);
      setForm(EMPTY);
      toast.success("Agendamento enviado!", {
        description: "Sua solicitação está pendente de aprovação.",
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Tente novamente em instantes.";
      console.error("Erro ao enviar agendamento:", err);
      toast.error("Não foi possível enviar o agendamento.", {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 animate-fade-in">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Agendamento recebido!
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sua solicitação foi registrada com o protocolo{" "}
          <span className="font-mono font-semibold text-primary">
            #{success}
          </span>{" "}
          e está <strong>pendente de aprovação</strong>. Assim que confirmada,
          seu veículo entrará na fila de atendimento.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/fila" className={cn(buttonVariants({ size: "lg" }))}>
            <Radio className="text-primary-foreground" />
            Acompanhar a fila
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setSuccess(null)}
          >
            Fazer novo agendamento
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-x-clip px-4 py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-10 size-72 -translate-x-1/3 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-10 right-0 size-72 translate-x-1/3 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto mb-10 w-full max-w-6xl 3xl:max-w-[1700px] text-center">
        <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <CalendarCheck className="size-7" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Agende seu serviço
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Preencha os dados abaixo. Sua solicitação será analisada e confirmada
          pela nossa equipe.
        </p>
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl 3xl:max-w-[1700px] gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Formulário */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Dados do agendamento</CardTitle>
            <CardDescription>
              Campos marcados com <span className="text-primary">*</span> são
              obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome completo <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="nome"
                      placeholder="Ex.: João Marcos Silva"
                      className="pl-9"
                      value={form.cliente_nome}
                      onChange={(e) => update("cliente_nome", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone / WhatsApp <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="tel"
                      inputMode="tel"
                      placeholder="(11) 99999-0000"
                      className="pl-9"
                      value={form.telefone}
                      onChange={(e) => update("telefone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placa">
                    Placa do carro{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Car className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="placa"
                      placeholder="ABC1D23"
                      className="pl-9 uppercase"
                      value={form.placa}
                      onChange={(e) => update("placa", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">
                    Modelo / Marca <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <Car className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="modelo"
                      placeholder="Ex.: Toyota Corolla 2020"
                      className="pl-9"
                      value={form.modelo}
                      onChange={(e) => update("modelo", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servico">
                    Serviço desejado <span className="text-primary">*</span>
                  </Label>
                  <Select
                    id="servico"
                    value={form.servico_nome}
                    onChange={(e) => selecionarServico(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione um serviço
                    </option>
                    {ativos.map((s) => (
                      <option key={s.id} value={s.titulo}>
                        {s.titulo === "Avaliação"
                          ? "Avaliação — não sei qual o defeito"
                          : s.titulo}
                      </option>
                    ))}
                  </Select>
                  {form.servico_nome === "Avaliação" && (
                    <p className="text-xs text-muted-foreground">
                      Nossa equipe vai inspecionar o veículo e informar o que
                      precisa ser feito antes de iniciar qualquer reparo.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarCheck className="size-4 text-primary" />
                  Escolha o dia e o período{" "}
                  <span className="text-primary">*</span>
                </Label>
                <SchedulePicker
                  value={form.data_hora}
                  onChange={selecionarPeriodo}
                  durationPeriods={duracaoPeriodos}
                  serviceSelected={!!form.servico_nome}
                />
              </div>

              {janelaChegada && (
                <div className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="horario_chegada"
                      className="flex items-center gap-2"
                    >
                      <Clock className="size-4 text-primary" />
                      Qual horário você vai deixar o carro?{" "}
                      <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="horario_chegada"
                      type="time"
                      min={janelaChegada.min}
                      max={janelaChegada.max}
                      value={form.horario_chegada}
                      onChange={(e) =>
                        update("horario_chegada", e.target.value)
                      }
                      className="max-w-xs"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Período da {janelaChegada.label.toLowerCase()}: entre{" "}
                      {janelaChegada.min} e {janelaChegada.max}.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="obs" className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Observações (opcional)
                </Label>
                <Textarea
                  id="obs"
                  placeholder="Descreva o problema ou detalhes que ajudem nossa equipe."
                  value={form.observacoes}
                  onChange={(e) => update("observacoes", e.target.value)}
                />
              </div>

              {/* Ativar notificações do serviço */}
              <div
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  pushStatus === "enabled"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-primary/25 bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      pushStatus === "enabled"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-primary/15 text-primary"
                    )}
                  >
                    {pushStatus === "enabled" ? (
                      <BellRing className="size-5" />
                    ) : (
                      <Bell className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {pushStatus === "enabled"
                        ? "Notificações ativadas"
                        : "Receba avisos no seu celular"}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {pushStatus === "enabled"
                        ? "Você será avisado quando o pedido for aceito e a cada atualização do serviço."
                        : "Ative para saber na hora quando seu pedido for aceito e quando o carro estiver pronto."}
                    </p>

                    {pushStatus !== "enabled" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={handleEnablePush}
                        disabled={pushStatus === "enabling"}
                      >
                        {pushStatus === "enabling" ? (
                          <>
                            <Loader2 className="animate-spin" />
                            Ativando...
                          </>
                        ) : (
                          <>
                            <Bell />
                            Ativar notificações
                          </>
                        )}
                      </Button>
                    )}

                    {pushMsg && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-500">
                        <Smartphone className="mt-0.5 size-3.5 shrink-0" />
                        <span>{pushMsg}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar solicitação
                    <ArrowRight />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Sem custo para agendar. Você só confirma após nosso retorno.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Painel lateral informativo */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Como funciona
            </h3>
            <ol className="mt-4 space-y-4">
              {[
                {
                  icon: CalendarCheck,
                  title: "Você envia o pedido",
                  desc: "Preencha o formulário com os dados do veículo.",
                },
                {
                  icon: ShieldCheck,
                  title: "Nós confirmamos",
                  desc: "Analisamos e retornamos confirmando o horário.",
                },
                {
                  icon: Wrench,
                  title: "Entra na fila",
                  desc: "Seu carro entra no atendimento e você acompanha ao vivo.",
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-4" />
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="size-4" />
              <p className="text-sm font-semibold">Prefere acompanhar?</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Veja em tempo real os veículos em atendimento na oficina.
            </p>
            <Link
              href="/fila"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 w-full"
              )}
            >
              <Radio className="text-primary" />
              Ver fila ao vivo
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
