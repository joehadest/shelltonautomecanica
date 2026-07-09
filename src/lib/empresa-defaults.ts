import type { ConfiguracaoEmpresa } from "./types";

export const DEFAULT_EMPRESA: Omit<
  ConfiguracaoEmpresa,
  "id" | "updated_at" | "assinatura_base64" | "logo_base64"
> & { assinatura_base64: null; logo_base64: null } = {
  razao_social: "Shellton Auto Mecânica LTDA",
  nome_fantasia: "Shellton Auto Mecânica",
  cnpj: "00.000.000/0001-00",
  inscricao_estadual: "",
  endereco: "Av. das Oficinas, 1234",
  cidade_uf: "São Paulo — SP",
  telefone: "(11) 99999-0000",
  email: "contato@shelltonautomecanica.com.br",
  logo_base64: null,
  assinatura_base64: null,
  assinatura_responsavel: "Responsável técnico",
};

export function resolveEmpresa(
  empresa: ConfiguracaoEmpresa | null
): ConfiguracaoEmpresa {
  if (empresa) return empresa;
  return {
    id: "default",
    ...DEFAULT_EMPRESA,
    updated_at: new Date().toISOString(),
  };
}
