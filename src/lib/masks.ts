/** Utilitários de máscara de input (Brasil). */

export type MaskKind =
  | "phone"
  | "placa"
  | "cnpj"
  | "currency"
  | "digits"
  | "time";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Telefone BR: (11) 98888-1234 ou (11) 3333-4444 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Placa BR — Mercosul (ABC1D23) ou antiga (ABC-1234).
 * Aceita digitação mista e normaliza em maiúsculas.
 */
export function maskPlaca(value: string): string {
  const raw = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);

  if (raw.length <= 3) return raw;

  const letters = raw.slice(0, 3).replace(/[^A-Z]/g, "");
  const rest = raw.slice(3);

  // Padrão antigo: 3 letras + 4 dígitos → ABC-1234
  if (/^\d+$/.test(rest) && rest.length <= 4) {
    return `${letters}-${rest}`;
  }

  // Mercosul: AAA0A00
  let out = letters;
  for (let i = 0; i < rest.length && out.length < 7; i++) {
    const ch = rest[i];
    const pos = out.length;
    if (pos === 3 && /\d/.test(ch)) out += ch;
    else if (pos === 4 && /[A-Z]/.test(ch)) out += ch;
    else if (pos >= 5 && /\d/.test(ch)) out += ch;
  }
  return out;
}

/** CNPJ: 00.000.000/0000-00 */
export function maskCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Moeda BR enquanto digita.
 * Aceita "150,50" ou "150.50" e formata como 150,50.
 */
export function maskCurrency(value: string): string {
  const cleaned = value.replace(/[^\d,.]/g, "");
  if (!cleaned) return "";

  const normalized = cleaned.replace(/\./g, ",");
  const parts = normalized.split(",");
  const intPart = onlyDigits(parts[0] ?? "").replace(/^0+(?=\d)/, "") || "0";
  if (parts.length === 1) {
    return intPart;
  }
  const dec = onlyDigits(parts[1] ?? "").slice(0, 2);
  return `${intPart},${dec}`;
}

/** Converte valor mascarado de moeda para number. */
export function currencyToNumber(value: string): number {
  const n = parseFloat(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Formata number → string mascarada (ex.: 150.5 → "150,50"). */
export function numberToCurrencyMask(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Apenas dígitos, com limite opcional. */
export function maskDigits(value: string, maxLen = 20): string {
  return onlyDigits(value).slice(0, maxLen);
}

/** Horário HH:MM */
export function maskTime(value: string): string {
  const d = onlyDigits(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function applyMask(kind: MaskKind, value: string): string {
  switch (kind) {
    case "phone":
      return maskPhone(value);
    case "placa":
      return maskPlaca(value);
    case "cnpj":
      return maskCnpj(value);
    case "currency":
      return maskCurrency(value);
    case "digits":
      return maskDigits(value);
    case "time":
      return maskTime(value);
    default:
      return value;
  }
}

export function maskInputMode(
  kind: MaskKind
): "numeric" | "decimal" | "text" | undefined {
  switch (kind) {
    case "phone":
    case "cnpj":
    case "digits":
    case "time":
      return "numeric";
    case "currency":
      return "decimal";
    case "placa":
      return "text";
    default:
      return undefined;
  }
}
