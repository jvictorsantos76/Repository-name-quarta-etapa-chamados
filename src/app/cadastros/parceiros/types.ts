export const TIPOS_PARCEIRO = [
  "cliente",
  "fornecedor",
  "parceiro",
  "prestador",
  "transportadora",
  "interno",
  "prospect",
  "fabricante",
  "terceirizado",
] as const;

export const TIPOS_PESSOA = [
  "juridica",
  "fisica",
] as const;

export const SITUACOES_PARCEIRO = [
  "ativo",
  "implantacao",
  "prospect",
  "suspenso",
  "bloqueado",
  "encerrado",
  "inativo",
] as const;

export const OPCOES_CRT = [
  "simples_nacional",
  "lucro_presumido",
  "lucro_real",
  "mei",
  "isento",
  "nao_informado",
] as const;

export const SEGMENTOS_PARCEIRO = [
  "varejo",
  "alimentacao",
  "saude",
  "educacao",
  "governo",
  "financeiro",
  "logistica",
  "industria",
  "servicos",
  "tecnologia",
  "outro",
] as const;

export const TIPOS_CONTATO = [
  "comercial",
  "financeiro",
  "tecnico",
  "operacional",
  "administrativo",
  "compras",
  "diretoria",
  "fiscal",
  "contratos",
  "sla",
] as const;

export const DEPARTAMENTOS_CONTATO = [
  "ti",
  "financeiro",
  "operacao",
  "compras",
  "fiscal",
  "administrativo",
  "diretoria",
  "frente_de_loja",
  "facilities",
  "rh",
  "outro",
] as const;

export const CARGOS_CONTATO = [
  "gerente",
  "coordenador",
  "supervisor",
  "analista",
  "tecnico",
  "responsavel_financeiro",
  "responsavel_operacional",
  "responsavel_ti",
  "proprietario",
  "diretor",
  "outro",
] as const;

export const UFS_BRASIL = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
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
export type TipoPessoa = (typeof TIPOS_PESSOA)[number];
export type SituacaoParceiro = (typeof SITUACOES_PARCEIRO)[number];
export type OpcaoCrt = (typeof OPCOES_CRT)[number];
export type SegmentoParceiro = (typeof SEGMENTOS_PARCEIRO)[number];
export type TipoContato = (typeof TIPOS_CONTATO)[number];
export type DepartamentoContato = (typeof DEPARTAMENTOS_CONTATO)[number];
export type CargoContato = (typeof CARGOS_CONTATO)[number];
export type StatusFilial = (typeof STATUS_FILIAL)[number];
export type StatusContrato = (typeof STATUS_CONTRATO)[number];

export type ParceiroResumo = {
  id: string;
  tipo_parceiro: TipoParceiro;
  tipo_pessoa?: TipoPessoa | null;
  razao_social: string;
  nome_fantasia: string;
  codigo_interno: string | null;
  cnpj_cpf: string | null;
  situacao: SituacaoParceiro;
  segmento: string | null;
  ativo: boolean;
  cliente_legado_id: string | null;
  organizacao_id: string | null;
  cliente_legado_nome?: string | null;
  organizacao_nome?: string | null;
  filiais_count?: number;
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
  tipo_contato: TipoContato | null;
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
  loja_legado_nome?: string | null;
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
  organizacao_legada_nome?: string | null;
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

export type OrganizacaoParceiroOpcao = {
  id: string;
  nome: string;
  codigo_interno: string | null;
  ativo: boolean;
};

export const LABEL_TIPO_PARCEIRO: Record<TipoParceiro, string> = {
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  parceiro: "Parceiro",
  prestador: "Prestador",
  transportadora: "Transportadora",
  interno: "Interno",
  prospect: "Prospect",
  fabricante: "Fabricante",
  terceirizado: "Terceirizado",
};

export const LABEL_TIPO_PESSOA: Record<TipoPessoa, string> = {
  juridica: "Pessoa Jurídica",
  fisica: "Pessoa Física",
};

export const LABEL_SITUACAO_PARCEIRO: Record<SituacaoParceiro, string> = {
  ativo: "Ativo",
  implantacao: "Em implantação",
  prospect: "Prospect",
  suspenso: "Suspenso",
  bloqueado: "Bloqueado",
  encerrado: "Encerrado",
  inativo: "Inativo",
};

export const LABEL_CRT: Record<OpcaoCrt, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
  isento: "Isento",
  nao_informado: "Não informado",
};

export const LABEL_SEGMENTO_PARCEIRO: Record<SegmentoParceiro, string> = {
  varejo: "Varejo",
  alimentacao: "Alimentação",
  saude: "Saúde",
  educacao: "Educação",
  governo: "Governo",
  financeiro: "Financeiro",
  logistica: "Logística",
  industria: "Indústria",
  servicos: "Serviços",
  tecnologia: "Tecnologia",
  outro: "Outro",
};

export const LABEL_TIPO_CONTATO: Record<TipoContato, string> = {
  comercial: "Comercial",
  financeiro: "Financeiro",
  tecnico: "Técnico",
  operacional: "Operacional",
  administrativo: "Administrativo",
  compras: "Compras",
  diretoria: "Diretoria",
  fiscal: "Fiscal",
  contratos: "Contratos",
  sla: "SLA",
};

export const LABEL_DEPARTAMENTO_CONTATO: Record<DepartamentoContato, string> = {
  ti: "TI",
  financeiro: "Financeiro",
  operacao: "Operação",
  compras: "Compras",
  fiscal: "Fiscal",
  administrativo: "Administrativo",
  diretoria: "Diretoria",
  frente_de_loja: "Frente de Loja",
  facilities: "Facilities",
  rh: "RH",
  outro: "Outro",
};

export const LABEL_CARGO_CONTATO: Record<CargoContato, string> = {
  gerente: "Gerente",
  coordenador: "Coordenador",
  supervisor: "Supervisor",
  analista: "Analista",
  tecnico: "Técnico",
  responsavel_financeiro: "Responsável financeiro",
  responsavel_operacional: "Responsável operacional",
  responsavel_ti: "Responsável de TI",
  proprietario: "Proprietário",
  diretor: "Diretor",
  outro: "Outro",
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

export function isTipoPessoa(value: string): value is TipoPessoa {
  return TIPOS_PESSOA.includes(value as TipoPessoa);
}

export function isSituacaoParceiro(value: string): value is SituacaoParceiro {
  return SITUACOES_PARCEIRO.includes(value as SituacaoParceiro);
}

export function isOpcaoCrt(value: string): value is OpcaoCrt {
  return OPCOES_CRT.includes(value as OpcaoCrt);
}

export function isSegmentoParceiro(value: string): value is SegmentoParceiro {
  return SEGMENTOS_PARCEIRO.includes(value as SegmentoParceiro);
}

export function isTipoContato(value: string): value is TipoContato {
  return TIPOS_CONTATO.includes(value as TipoContato);
}

export function isDepartamentoContato(value: string): value is DepartamentoContato {
  return DEPARTAMENTOS_CONTATO.includes(value as DepartamentoContato);
}

export function isCargoContato(value: string): value is CargoContato {
  return CARGOS_CONTATO.includes(value as CargoContato);
}

export function isStatusFilial(value: string): value is StatusFilial {
  return STATUS_FILIAL.includes(value as StatusFilial);
}

export function isStatusContrato(value: string): value is StatusContrato {
  return STATUS_CONTRATO.includes(value as StatusContrato);
}
