export const TIPOS_PARCEIRO = [
  "cliente",
  "fornecedor",
  "fabricante",
  "terceirizado",
  "transportadora",
] as const;

export const SITUACOES_PARCEIRO = [
  "ativo",
  "inativo",
  "prospect",
  "bloqueado",
] as const;

export const STATUS_FILIAL = [
  "ativa",
  "inativa",
  "bloqueada",
  "implantacao",
] as const;

export const STATUS_CONTRATO = [
  "ativo",
  "inativo",
  "encerrado",
  "em_negociacao",
] as const;

export type TipoParceiro = (typeof TIPOS_PARCEIRO)[number];
export type SituacaoParceiro = (typeof SITUACOES_PARCEIRO)[number];
export type StatusFilial = (typeof STATUS_FILIAL)[number];
export type StatusContrato = (typeof STATUS_CONTRATO)[number];

export type ParceiroResumo = {
  id: string;
  tipo_parceiro: TipoParceiro;
  razao_social: string;
  nome_fantasia: string;
  codigo_interno: string | null;
  cnpj_cpf: string | null;
  situacao: SituacaoParceiro;
  segmento: string | null;
  ativo: boolean;
  cliente_legado_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type ParceiroEndereco = {
  id: string;
  parceiro_id: string;
  tipo_endereco: string;
  principal: boolean;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  latitude: number | null;
  longitude: number | null;
  ativo: boolean;
};

export type ParceiroContato = {
  id: string;
  parceiro_id: string;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
  email: string | null;
  departamento: string | null;
  principal: boolean;
  contato_financeiro: boolean;
  contato_tecnico: boolean;
  contato_operacional: boolean;
  ativo: boolean;
};

export type ParceiroFilial = {
  id: string;
  parceiro_id: string;
  loja_legado_id: string | null;
  nome_filial: string;
  codigo_interno: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  sla_padrao: string | null;
  horario_atendimento: string | null;
  observacoes_operacionais: string | null;
  status: StatusFilial;
  ativo: boolean;
};

export type ParceiroFinanceiro = {
  parceiro_id: string;
  condicao_pagamento: string | null;
  limite_credito: number | null;
  categoria_financeira: string | null;
  centro_custo: string | null;
  vendedor: string | null;
  comissao: number | null;
  forma_pagamento_padrao: string | null;
  responsavel_financeiro: string | null;
  email_nf: string | null;
  dia_faturamento: number | null;
  retencao: string | null;
  natureza_operacao: string | null;
  observacoes_financeiras: string | null;
};

export type ParceiroOperacional = {
  parceiro_id: string;
  sla_padrao: string | null;
  atendimento_remoto: boolean;
  atendimento_presencial: boolean;
  cobranca_km: boolean;
  valor_km: number | null;
  horario_atendimento: string | null;
  cobertura: string | null;
  criticidade: string | null;
  necessita_agendamento: boolean;
  necessita_autorizacao: boolean;
  exige_cracha: boolean;
  exige_foto: boolean;
  restricao_horario: string | null;
  contato_escalonamento: string | null;
  grupo_tecnico_padrao: string | null;
  observacoes_operacionais: string | null;
};

export type ParceiroContrato = {
  id: string;
  parceiro_id: string;
  contrato: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  sla: string | null;
  status: StatusContrato;
  observacoes: string | null;
};

export type ParceiroAnexo = {
  id: string;
  parceiro_id: string;
  nome_original: string;
  path_storage: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  usuario_id: string;
  observacao: string | null;
  created_at: string;
};

export type ParceiroHistorico = {
  id: string;
  parceiro_id: string;
  parceiro_filial_id: string | null;
  usuario_id: string | null;
  tipo_evento: string;
  descricao: string;
  dados: Record<string, unknown> | null;
  created_at: string;
};

export type ParceiroDetalhe = ParceiroResumo & {
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  crt: string | null;
  cliente_desde: string | null;
  cnae: string | null;
  suframa: string | null;
  website: string | null;
  criado_por: string | null;
  atualizado_por: string | null;
  endereco_principal: ParceiroEndereco | null;
  contato_principal: ParceiroContato | null;
  filiais: ParceiroFilial[];
  contatos: ParceiroContato[];
  financeiro: ParceiroFinanceiro | null;
  operacional: ParceiroOperacional | null;
  contratos: ParceiroContrato[];
  anexos: ParceiroAnexo[];
  historico: ParceiroHistorico[];
};

export const LABEL_TIPO_PARCEIRO: Record<TipoParceiro, string> = {
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  fabricante: "Fabricante",
  terceirizado: "Terceirizado",
  transportadora: "Transportadora",
};

export const LABEL_SITUACAO_PARCEIRO: Record<SituacaoParceiro, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  prospect: "Prospect",
  bloqueado: "Bloqueado",
};

export const LABEL_STATUS_FILIAL: Record<StatusFilial, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
  bloqueada: "Bloqueada",
  implantacao: "Implantação",
};

export const LABEL_STATUS_CONTRATO: Record<StatusContrato, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  encerrado: "Encerrado",
  em_negociacao: "Em negociação",
};

export function isTipoParceiro(value: string): value is TipoParceiro {
  return TIPOS_PARCEIRO.includes(value as TipoParceiro);
}

export function isSituacaoParceiro(value: string): value is SituacaoParceiro {
  return SITUACOES_PARCEIRO.includes(value as SituacaoParceiro);
}

export function isStatusFilial(value: string): value is StatusFilial {
  return STATUS_FILIAL.includes(value as StatusFilial);
}

export function isStatusContrato(value: string): value is StatusContrato {
  return STATUS_CONTRATO.includes(value as StatusContrato);
}
