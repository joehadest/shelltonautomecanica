"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, Save, Upload, X, PenLine, ImageIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { useDB, empresaApi } from "@/lib/store";
import { resolveEmpresa } from "@/lib/empresa-defaults";
import { DEFAULT_LOGO_PATH } from "@/lib/empresa-logo";
import { maskCnpj, maskPhone } from "@/lib/masks";
import type { ConfiguracaoEmpresa } from "@/lib/types";

type EmpresaDraft = Omit<
  ConfiguracaoEmpresa,
  "id" | "updated_at" | "assinatura_base64" | "logo_base64"
> & { assinatura_base64: string | null; logo_base64: string | null };

function toDraft(empresa: ConfiguracaoEmpresa): EmpresaDraft {
  return {
    razao_social: empresa.razao_social,
    nome_fantasia: empresa.nome_fantasia,
    cnpj: maskCnpj(empresa.cnpj),
    inscricao_estadual: empresa.inscricao_estadual,
    endereco: empresa.endereco,
    cidade_uf: empresa.cidade_uf,
    telefone: maskPhone(empresa.telefone),
    email: empresa.email,
    logo_base64: empresa.logo_base64,
    assinatura_base64: empresa.assinatura_base64,
    assinatura_responsavel: empresa.assinatura_responsavel,
  };
}

const MAX_IMAGE_BYTES = 500_000;

export function EmpresaConfigCard() {
  const { empresaConfig } = useDB();
  const resolved = resolveEmpresa(empresaConfig);
  const [draft, setDraft] = useState<EmpresaDraft>(() => toDraft(resolved));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(toDraft(resolveEmpresa(empresaConfig)));
  }, [empresaConfig]);

  const current = toDraft(resolved);
  const hasChanges =
    (Object.keys(draft) as (keyof EmpresaDraft)[]).some(
      (k) => draft[k] !== current[k]
    );

  function update<K extends keyof EmpresaDraft>(key: K, value: EmpresaDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onImageFile(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo_base64" | "assinatura_base64",
    label: string
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem PNG ou JPG.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Imagem muito grande. Máximo 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update(field, reader.result as string);
      toast.success(`${label} carregada. Salve para aplicar nos PDFs.`);
    };
    reader.onerror = () => toast.error("Erro ao ler o arquivo.");
    reader.readAsDataURL(file);
  }

  function onAssinaturaFile(e: React.ChangeEvent<HTMLInputElement>) {
    onImageFile(e, "assinatura_base64", "Assinatura");
  }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    onImageFile(e, "logo_base64", "Logo");
  }

  function removerAssinatura() {
    update("assinatura_base64", null);
  }

  function removerLogo() {
    update("logo_base64", null);
  }

  async function salvar() {
    if (!draft.razao_social.trim() || !draft.nome_fantasia.trim()) {
      toast.error("Preencha razão social e nome fantasia.");
      return;
    }
    if (!draft.cnpj.trim()) {
      toast.error("Informe o CNPJ.");
      return;
    }
    setSaving(true);
    try {
      await empresaApi.update(draft);
      toast.success("Dados da empresa salvos! Aparecerão no topo dos PDFs.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar dados da empresa.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              Dados da empresa (PDF)
            </CardTitle>
            <CardDescription>
              CNPJ, endereço e assinatura exibidos no cabeçalho e rodapé dos
              documentos.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          >
            {open ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5 border-t border-border pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emp-razao">Razão social</Label>
              <Input
                id="emp-razao"
                value={draft.razao_social}
                onChange={(e) => update("razao_social", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-fantasia">Nome fantasia</Label>
              <Input
                id="emp-fantasia"
                value={draft.nome_fantasia}
                onChange={(e) => update("nome_fantasia", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-cnpj">CNPJ</Label>
              <MaskedInput
                id="emp-cnpj"
                mask="cnpj"
                value={draft.cnpj}
                onValueChange={(v) => update("cnpj", v)}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-ie">Inscrição estadual</Label>
              <Input
                id="emp-ie"
                value={draft.inscricao_estadual}
                onChange={(e) => update("inscricao_estadual", e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emp-end">Endereço</Label>
              <Input
                id="emp-end"
                value={draft.endereco}
                onChange={(e) => update("endereco", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-cidade">Cidade / UF</Label>
              <Input
                id="emp-cidade"
                value={draft.cidade_uf}
                onChange={(e) => update("cidade_uf", e.target.value)}
                placeholder="São Paulo — SP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-tel">Telefone</Label>
              <MaskedInput
                id="emp-tel"
                mask="phone"
                placeholder="(11) 99999-0000"
                value={draft.telefone}
                onValueChange={(v) => update("telefone", v)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emp-email">E-mail</Label>
              <Input
                id="emp-email"
                type="email"
                value={draft.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Logo da empresa
              </p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Aparece ao lado do nome no topo do PDF. Se não enviar, usamos a
              logo do site ({DEFAULT_LOGO_PATH}).
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-20 min-w-[120px] flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-background p-2">
                {draft.logo_base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.logo_base64}
                    alt="Logo da empresa"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={DEFAULT_LOGO_PATH}
                    alt="Logo padrão do site"
                    className="max-h-full max-w-full object-contain opacity-70"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={onLogoFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoRef.current?.click()}
                >
                  <Upload />
                  Enviar logo
                </Button>
                {draft.logo_base64 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removerLogo}
                  >
                    <X />
                    Usar logo do site
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <PenLine className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Assinatura da empresa
              </p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Envie uma imagem PNG ou JPG com fundo transparente. Ela aparece
              automaticamente nos PDFs. A assinatura do cliente fica em branco
              para preenchimento presencial.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-24 min-w-[180px] flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-background p-2">
                {draft.assinatura_base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.assinatura_base64}
                    alt="Assinatura da empresa"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Nenhuma assinatura
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={onAssinaturaFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload />
                  Enviar imagem
                </Button>
                {draft.assinatura_base64 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removerAssinatura}
                  >
                    <X />
                    Remover
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label htmlFor="emp-resp">Nome abaixo da assinatura</Label>
              <Input
                id="emp-resp"
                value={draft.assinatura_responsavel}
                onChange={(e) =>
                  update("assinatura_responsavel", e.target.value)
                }
                placeholder="Ex.: Carlos Shellton — Gerente"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={salvar} disabled={saving || !hasChanges}>
              <Save />
              {saving ? "Salvando..." : "Salvar dados da empresa"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
