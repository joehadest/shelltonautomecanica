import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata data ISO para "dd/mm/aaaa HH:MM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Mascara um nome completo: "João Marcos Silva" -> "João M." */
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

/** Mascara uma placa: "ABC1D23" -> "ABC-*23" (esconde caracteres do meio). */
export function maskPlate(plate: string): string {
  const clean = plate.replace(/[\s-]/g, "").toUpperCase();
  if (clean.length <= 3) return clean;
  const start = clean.slice(0, 3);
  const end = clean.slice(-2);
  return `${start}-*${end}`;
}

/** Gera um id simples (substituível por uuid do banco). */
export function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}
