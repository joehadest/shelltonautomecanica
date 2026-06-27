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
import { useDB, getServicosAtivos, agendamentosApi } from "@/lib/store";
import { cn } from "@/lib/utils";

interface FormState {
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  data_hora: string;
  observacoes: string;
}

const EMPTY: FormState = {
  cliente_nome: "",
  telefone: "",
  placa: "",
  modelo: "",
  servico_nome: "",
  data_hora: "",
  observacoes: "",
};

export default function AgendamentoPage() {
  const { servicos } = useDB();
  const ativos = getServicosAtivos(servicos);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.cliente_nome ||
      !form.telefone ||
      !form.placa ||
      !form.modelo ||
      !form.servico_nome ||
      !form.data_hora
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const novo = await agendamentosApi.create({
        cliente_nome: form.cliente_nome.trim(),
        telefone: form.telefone.trim(),
        placa: form.placa.trim().toUpperCase(),
        modelo: form.modelo.trim(),
        servico_nome: form.servico_nome,
        data_hora: new Date(form.data_hora).toISOString(),
        observacoes: form.observacoes.trim() || undefined,
      });
      setSuccess(novo.id);
      setForm(EMPTY);
      toast.success("Agendamento enviado!", {
        description: "Sua solicitação está pendente de aprovação.",
      });
    } catch {
      toast.error("Não foi possível enviar o agendamento. Tente novamente.");
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
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarCheck className="size-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Agende seu serviço
        </h1>
        <p className="mt-3 text-muted-foreground">
          Preencha os dados abaixo. Sua solicitação será analisada e confirmada
          pela nossa equipe.
        </p>
      </div>

      <Card>
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
                <Input
                  id="nome"
                  placeholder="Ex.: João Marcos Silva"
                  value={form.cliente_nome}
                  onChange={(e) => update("cliente_nome", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone / WhatsApp <span className="text-primary">*</span>
                </Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-0000"
                  value={form.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placa">
                  Placa do carro <span className="text-primary">*</span>
                </Label>
                <Input
                  id="placa"
                  placeholder="ABC1D23"
                  className="uppercase"
                  value={form.placa}
                  onChange={(e) => update("placa", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">
                  Modelo / Marca <span className="text-primary">*</span>
                </Label>
                <Input
                  id="modelo"
                  placeholder="Ex.: Toyota Corolla 2020"
                  value={form.modelo}
                  onChange={(e) => update("modelo", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servico">
                  Serviço desejado <span className="text-primary">*</span>
                </Label>
                <Select
                  id="servico"
                  value={form.servico_nome}
                  onChange={(e) => update("servico_nome", e.target.value)}
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
              <div className="space-y-2">
                <Label htmlFor="data">
                  Data e hora pretendida <span className="text-primary">*</span>
                </Label>
                <Input
                  id="data"
                  type="datetime-local"
                  value={form.data_hora}
                  onChange={(e) => update("data_hora", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações (opcional)</Label>
              <Textarea
                id="obs"
                placeholder="Descreva o problema ou detalhes que ajudem nossa equipe."
                value={form.observacoes}
                onChange={(e) => update("observacoes", e.target.value)}
              />
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
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
