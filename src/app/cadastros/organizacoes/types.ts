export const TIPOS_ORGANIZACAO = [
  "cliente",
  "parceiro",
  "interno",
  "grupo_economico",
  "fornecedor",
  "fabricante",
  "orgao_publico",
  "outro",
] as const;

export type TipoOrganizacao = (typeof TIPOS_ORGANIZACAO)[number];

export type Organizacao = {
  id: string;
  nome: string;
  codigo_interno: string | null;
  tipo_organizacao: TipoOrganizacao;
  possui_filiais: boolean;
  ativo: boolean;
  observacoes: string | null;
  logo_url: string | null;
  cor_identificacao: string | null;
  sistema_externo_padrao: string | null;
  id_externo: string | null;
  criado_em: string;
  atualizado_em: string;
  criado_por: string | null;
  atualizado_por: string | null;
  clientes_vinculados_count?: number;
};

export type ClienteOrganizacao = {
  id: string;
  nome_fantasia: string;
  razao_social: string | null;
  ativo: boolean;
  organizacao_id: string | null;
};

export const LABEL_TIPO_ORGANIZACAO: Record<TipoOrganizacao, string> = {
  cliente: "Cliente",
  parceiro: "Parceiro",
  interno: "Interno",
  grupo_economico: "Grupo econômico",
  fornecedor: "Fornecedor",
  fabricante: "Fabricante",
  orgao_publico: "Órgão público",
  outro: "Outro",
};

export function isTipoOrganizacao(value: string): value is TipoOrganizacao {
  return TIPOS_ORGANIZACAO.includes(value as TipoOrganizacao);
}
