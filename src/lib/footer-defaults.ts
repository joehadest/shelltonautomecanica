import type { FooterConfig } from "./types";

export const DEFAULT_FOOTER: Omit<FooterConfig, "id" | "updated_at"> = {
  slogan: "Cuidando do seu carro com a precisão e a confiança que ele merece.",
  endereco: "Av. das Oficinas, 1234 — São Paulo, SP",
  telefone: "(11) 99999-0000",
  horario: "Seg a Sex: 8h–18h · Sáb: 8h–12h",
  instagram: "@shelltonautomecanica",
  instagram_url: "https://instagram.com/shelltonautomecanica",
  tagline: "Feito com dedicação para quem ama dirigir.",
};

export function resolveFooter(footer: FooterConfig | null): FooterConfig {
  if (footer) return footer;
  return {
    id: "default",
    ...DEFAULT_FOOTER,
    updated_at: new Date().toISOString(),
  };
}
