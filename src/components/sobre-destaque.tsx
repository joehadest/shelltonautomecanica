"use client";

import { useDB, getEstatisticasPorGrupo } from "@/lib/store";

export function SobreDestaque() {
  const { estatisticas } = useDB();
  const [destaque] = getEstatisticasPorGrupo(estatisticas, "sobre");

  if (!destaque) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
      <p className="text-3xl font-extrabold text-primary">{destaque.valor}</p>
      <p className="text-sm leading-tight text-muted-foreground">
        {destaque.rotulo}
      </p>
    </div>
  );
}
