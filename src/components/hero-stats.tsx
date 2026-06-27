"use client";

import { useDB, getEstatisticasPorGrupo, useDBLoading } from "@/lib/store";

export function HeroStats() {
  const { estatisticas } = useDB();
  const loading = useDBLoading();
  const stats = getEstatisticasPorGrupo(estatisticas, "hero");

  if (loading) {
    return (
      <div className="mx-auto mt-16 grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-card/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.id} className="text-center">
          <p className="text-2xl font-extrabold text-foreground sm:text-3xl">
            {stat.valor}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.rotulo}</p>
        </div>
      ))}
    </div>
  );
}
