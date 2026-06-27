import type { ConfiguracaoAgenda } from "./types";

export const DEFAULT_AGENDA: Omit<ConfiguracaoAgenda, "id" | "updated_at"> = {
  capacidade: 3,
  entradas_por_periodo: 1,
  manha_inicio: "07:30",
  manha_fim: "11:00",
  tarde_inicio: "13:30",
  tarde_fim: "17:00",
  semanas: 2,
  dias_semana: [1, 2, 3, 4, 5],
};

export function resolveAgenda(
  config: ConfiguracaoAgenda | null
): ConfiguracaoAgenda {
  if (config) return config;
  return {
    id: "default",
    ...DEFAULT_AGENDA,
    updated_at: new Date().toISOString(),
  };
}
