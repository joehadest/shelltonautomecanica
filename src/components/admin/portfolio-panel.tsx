"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDB, servicosApi } from "@/lib/store";
import { SERVICE_ICON_OPTIONS, getServiceIcon } from "@/lib/icons";
import type { Servico } from "@/lib/types";

interface FormState {
  titulo: string;
  descricao: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

const EMPTY: FormState = {
  titulo: "",
  descricao: "",
  icone: "Wrench",
  ordem: 1,
  ativo: true,
};

export function PortfolioPanel() {
  const { servicos } = useDB();
  const ordenados = [...servicos].sort((a, b) => a.ordem - b.ordem);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, ordem: ordenados.length + 1 });
    setOpen(true);
  }

  function openEdit(s: Servico) {
    setEditing(s);
    setForm({
      titulo: s.titulo,
      descricao: s.descricao,
      icone: s.icone,
      ordem: s.ordem,
      ativo: s.ativo,
    });
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast.error("Preencha título e descrição.");
      return;
    }
    try {
      if (editing) {
        await servicosApi.update(editing.id, { ...form });
        toast.success("Serviço atualizado.");
      } else {
        await servicosApi.create({ ...form });
        toast.success("Serviço criado.");
      }
      setOpen(false);
    } catch {
      toast.error("Erro ao salvar serviço.");
    }
  }

  async function remover(s: Servico) {
    if (!confirm(`Excluir o serviço "${s.titulo}"?`)) return;
    try {
      await servicosApi.remove(s.id);
      toast.success("Serviço excluído.");
    } catch {
      toast.error("Erro ao excluir serviço.");
    }
  }

  async function toggleAtivo(s: Servico) {
    try {
      await servicosApi.update(s.id, { ativo: !s.ativo });
      toast.success(s.ativo ? "Serviço ocultado do site." : "Serviço publicado.");
    } catch {
      toast.error("Erro ao atualizar visibilidade.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Serviços do portfólio
          </h2>
          <Badge variant="secondary">{ordenados.length}</Badge>
        </div>
        <Button onClick={openNew}>
          <Plus />
          Novo serviço
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
        {ordenados.map((s) => {
          const Icon = getServiceIcon(s.icone);
          return (
            <Card key={s.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                {s.ativo ? (
                  <Badge variant="success">Publicado</Badge>
                ) : (
                  <Badge variant="secondary">Oculto</Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground">{s.titulo}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {s.descricao}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Ordem: {s.ordem}
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEdit(s)}
                >
                  <Pencil />
                  Editar
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleAtivo(s)}
                  aria-label="Alternar visibilidade"
                >
                  {s.ativo ? <EyeOff /> : <Eye />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remover(s)}
                  aria-label="Excluir"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </Card>
          );
        })}

        {ordenados.length === 0 && (
          <Card className="col-span-full flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum serviço cadastrado.
            </p>
            <Button onClick={openNew}>
              <Plus />
              Adicionar primeiro serviço
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>
            <DialogDescription>
              Esses dados aparecem no portfólio da página inicial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => update("titulo", e.target.value)}
                placeholder="Ex.: Troca de óleo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => update("descricao", e.target.value)}
                placeholder="Breve descrição do serviço"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <Select
                  id="icone"
                  value={form.icone}
                  onChange={(e) => update("icone", e.target.value)}
                >
                  {SERVICE_ICON_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  min={1}
                  value={form.ordem}
                  onChange={(e) =>
                    update("ordem", Number(e.target.value) || 1)
                  }
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => update("ativo", e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Publicar no site (visível para clientes)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editing ? "Salvar alterações" : "Criar serviço"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
