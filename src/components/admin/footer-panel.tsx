"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PanelBottom, Save } from "lucide-react";
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
import { useDB, footerApi } from "@/lib/store";
import { resolveFooter } from "@/lib/footer-defaults";
import type { FooterConfig } from "@/lib/types";

type FooterDraft = Omit<FooterConfig, "id" | "updated_at">;

function toDraft(footer: FooterConfig): FooterDraft {
  return {
    slogan: footer.slogan,
    endereco: footer.endereco,
    telefone: footer.telefone,
    horario: footer.horario,
    instagram: footer.instagram,
    instagram_url: footer.instagram_url,
    tagline: footer.tagline,
  };
}

export function FooterPanel() {
  const { footer } = useDB();
  const resolved = resolveFooter(footer);
  const [draft, setDraft] = useState<FooterDraft>(() => toDraft(resolved));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(resolveFooter(footer)));
  }, [footer]);

  function update<K extends keyof FooterDraft>(key: K, value: FooterDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const current = toDraft(resolved);
  const hasChanges = (Object.keys(draft) as (keyof FooterDraft)[]).some(
    (k) => draft[k] !== current[k]
  );

  async function salvar() {
    setSaving(true);
    try {
      await footerApi.update(draft);
      toast.success("Rodapé atualizado no site!");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao salvar rodapé.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PanelBottom className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Informações do rodapé
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Edite os textos de contato e redes sociais exibidos no rodapé de todas
        as páginas públicas.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdo do rodapé</CardTitle>
          <CardDescription>
            Slogan, endereço, telefone, horário e redes sociais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan (abaixo do logo)</Label>
            <Textarea
              id="slogan"
              value={draft.slogan}
              onChange={(e) => update("slogan", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={draft.endereco}
                onChange={(e) => update("endereco", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <Input
                id="telefone"
                value={draft.telefone}
                onChange={(e) => update("telefone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horário de funcionamento</Label>
              <Input
                id="horario"
                value={draft.horario}
                onChange={(e) => update("horario", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram (exibição)</Label>
              <Input
                id="instagram"
                value={draft.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="@shelltonautomecanica"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="instagram_url">Link do Instagram</Label>
              <Input
                id="instagram_url"
                type="url"
                value={draft.instagram_url}
                onChange={(e) => update("instagram_url", e.target.value)}
                placeholder="https://instagram.com/shelltonautomecanica"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tagline">Frase inferior (barra de copyright)</Label>
              <Input
                id="tagline"
                value={draft.tagline}
                onChange={(e) => update("tagline", e.target.value)}
              />
            </div>
          </div>

          <Button onClick={salvar} disabled={saving || !hasChanges}>
            <Save />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
