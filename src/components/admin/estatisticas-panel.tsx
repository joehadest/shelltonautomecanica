"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BarChart3, Save } from "lucide-react";
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
import { useDB, getEstatisticasPorGrupo, estatisticasApi } from "@/lib/store";
import type { EstatisticaSite } from "@/lib/types";

function StatForm({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: EstatisticaSite[];
}) {
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(items.map((e) => [e.id, { valor: e.valor, rotulo: e.rotulo }]))
  );
  const [saving, setSaving] = useState(false);

  function update(id: string, field: "valor" | "rotulo", value: string) {
    setDrafts((d) => ({
      ...d,
      [id]: { ...d[id], [field]: value },
    }));
  }

  async function salvar() {
    setSaving(true);
    try {
      for (const item of items) {
        const draft = drafts[item.id];
        if (draft.valor !== item.valor || draft.rotulo !== item.rotulo) {
          await estatisticasApi.update(item.id, draft);
        }
      }
      toast.success("Números atualizados no site!");
    } catch {
      toast.error("Erro ao salvar números.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = items.some((item) => {
    const draft = drafts[item.id];
    return draft.valor !== item.valor || draft.rotulo !== item.rotulo;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor={`valor-${item.id}`}>Número / valor</Label>
              <Input
                id={`valor-${item.id}`}
                value={drafts[item.id]?.valor ?? ""}
                onChange={(e) => update(item.id, "valor", e.target.value)}
                placeholder="Ex.: +15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`rotulo-${item.id}`}>Descrição</Label>
              <Input
                id={`rotulo-${item.id}`}
                value={drafts[item.id]?.rotulo ?? ""}
                onChange={(e) => update(item.id, "rotulo", e.target.value)}
                placeholder="Ex.: Anos de estrada"
              />
            </div>
          </div>
        ))}
        <Button onClick={salvar} disabled={saving || !hasChanges}>
          <Save />
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function EstatisticasPanel() {
  const { estatisticas } = useDB();
  const hero = getEstatisticasPorGrupo(estatisticas, "hero");
  const sobre = getEstatisticasPorGrupo(estatisticas, "sobre");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Números do site
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Edite os destaques numéricos exibidos na página inicial. As alterações
        aparecem no site em tempo real.
      </p>

      <StatForm
        key={hero.map((e) => `${e.id}-${e.valor}-${e.rotulo}`).join("|")}
        title="Topo da página (hero)"
        description="Os 4 números abaixo do título principal."
        items={hero}
      />

      <StatForm
        key={sobre.map((e) => `${e.id}-${e.valor}-${e.rotulo}`).join("|")}
        title="Seção Quem somos"
        description="Destaque no card lateral da seção sobre a oficina."
        items={sobre}
      />
    </div>
  );
}
