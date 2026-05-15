export type StatusChamado =
  | "pendente_agendamento"
  | "orcamento"
  | "agendado"
  | "em_atendimento"
  | "pendente_peca"
  | "resolvido"
  | "faturado";

export type CategoriaChamado =
  | "cabeamento"
  | "cftv"
  | "desktops"
  | "pdvs"
  | "automacao"
  | "atendimento_interno"
  | "impressoras_termicas"
  | "impressoras";

export type OpcaoVisual<T extends string> = {
  value: T;
  label: string;
};

export const statusChamadoOpcoes: OpcaoVisual<StatusChamado>[] = [
  { value: "pendente_agendamento", label: "Pendente de agendamento" },
  { value: "orcamento", label: "Orçamento" },
  { value: "agendado", label: "Agendado" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "pendente_peca", label: "Pendente Peça" },
  { value: "resolvido", label: "Resolvido" },
  { value: "faturado", label: "Faturado" },
];

export const categoriaChamadoOpcoes: OpcaoVisual<CategoriaChamado>[] = [
  { value: "cabeamento", label: "Cabeamento" },
  { value: "cftv", label: "CFTV" },
  { value: "desktops", label: "Desktops" },
  { value: "pdvs", label: "PDVs" },
  { value: "automacao", label: "Automação" },
  { value: "atendimento_interno", label: "Atendimento Interno" },
  { value: "impressoras_termicas", label: "Impressoras Térmicas" },
  { value: "impressoras", label: "Impressoras" },
];

export const ativosPorCategoria: Record<CategoriaChamado, string[]> = {
  cabeamento: [
    "Ponto de rede",
    "Patch cord",
    "Keystone",
    "Rack",
    "Switch",
    "Patch panel",
    "Cabo UTP",
    "Tomada RJ45",
  ],
  cftv: [
    "Câmera IP",
    "Câmera analógica",
    "DVR",
    "NVR",
    "Fonte CFTV",
    "Cabo coaxial",
    "Balun",
    "HD de gravação",
  ],
  desktops: [
    "CPU",
    "Monitor",
    "Teclado",
    "Mouse",
    "Nobreak",
    "Fonte",
    "Placa de rede",
    "SSD",
    "Memória RAM",
  ],
  pdvs: [
    "CPU PDV",
    "Monitor PDV",
    "Teclado PDV",
    "Mouse PDV",
    "Pinpad",
    "Scanner",
    "Gaveta de dinheiro",
    "Impressora térmica",
    "Leitor de código de barras",
  ],
  automacao: [
    "Controlador",
    "Sensor",
    "Relé",
    "Módulo de automação",
    "Fonte",
    "Interface serial",
    "Conversor USB/Serial",
    "Coletor de dados",
  ],
  atendimento_interno: [
    "Notebook",
    "Desktop administrativo",
    "Impressora administrativa",
    "Roteador",
    "Access point",
    "Switch interno",
    "Telefone IP",
    "Software interno",
  ],
  impressoras_termicas: [
    "Impressora térmica",
    "Cabeça térmica",
    "Fonte da impressora",
    "Cabo USB",
    "Cabo serial",
    "Guilhotina",
    "Bobina",
    "Placa lógica",
  ],
  impressoras: [
    "Impressora laser",
    "Impressora jato de tinta",
    "Multifuncional",
    "Toner",
    "Cartucho",
    "Cilindro",
    "Unidade fusora",
    "Bandeja de papel",
  ],
};

const statusClasses: Record<string, string> = {
  pendente_agendamento: "qe-badge qe-badge-status-pendente",
  aberto: "qe-badge qe-badge-status-pendente",
  pendente: "qe-badge qe-badge-status-pendente",
  orcamento: "qe-badge qe-badge-status-orcamento",
  orçamento: "qe-badge qe-badge-status-orcamento",
  em_orcamento: "qe-badge qe-badge-status-orcamento",
  pendente_orcamento: "qe-badge qe-badge-status-orcamento",
  agendado: "qe-badge qe-badge-status-agendado",
  analisado: "qe-badge qe-badge-status-analisado",
  em_atendimento: "qe-badge qe-badge-status-em-atendimento",
  "em-atendimento": "qe-badge qe-badge-status-em-atendimento",
  pendente_peca: "qe-badge qe-badge-status-pendente-peca",
  "pendente-peca": "qe-badge qe-badge-status-pendente-peca",
  resolvido: "qe-badge qe-badge-status-resolvido",
  finalizado: "qe-badge qe-badge-status-resolvido",
  concluido: "qe-badge qe-badge-status-resolvido",
  concluído: "qe-badge qe-badge-status-resolvido",
  faturado: "qe-badge qe-badge-status-faturado",
  arquivado: "qe-badge qe-badge-status-arquivado",
};

const prioridadeClasses: Record<string, string> = {
  baixa: "qe-badge qe-badge-priority-baixa",
  media: "qe-badge qe-badge-priority-media",
  média: "qe-badge qe-badge-priority-media",
  alta: "qe-badge qe-badge-priority-alta",
  critica: "qe-badge qe-badge-priority-critica",
  crítica: "qe-badge qe-badge-priority-critica",
};

const statusLabels: Record<string, string> = {
  pendente_agendamento: "Pendente de agendamento",
  orcamento: "Orçamento",
  agendado: "Agendado",
  em_atendimento: "Em atendimento",
  pendente_peca: "Pendente Peça",
  resolvido: "Resolvido",
  faturado: "Faturado",
  aberto: "Pendente de agendamento",
  pendente: "Pendente de agendamento",
  finalizado: "Resolvido",
  concluido: "Resolvido",
};

const categoriaLabels: Record<string, string> = Object.fromEntries(
  categoriaChamadoOpcoes.map((categoria) => [categoria.value, categoria.label])
);

const prioridadeLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export function getStatusClass(status: string) {
  return statusClasses[status] ?? "qe-badge qe-badge-status-neutro";
}

export function getPrioridadeClass(prioridade: string) {
  return prioridadeClasses[prioridade] ?? "qe-badge qe-badge-priority-neutra";
}

export function formatarStatus(status: string | null | undefined) {
  if (!status) {
    return "Não informado";
  }

  return statusLabels[status] ?? status;
}

export function getStatusLabel(status: string) {
  return formatarStatus(status);
}

export function getPrioridadeLabel(prioridade: string) {
  return prioridadeLabels[prioridade] ?? prioridade;
}

export function formatarCategoria(categoria: string | null | undefined) {
  if (!categoria) {
    return "Não informado";
  }

  return categoriaLabels[categoria] ?? categoria;
}
