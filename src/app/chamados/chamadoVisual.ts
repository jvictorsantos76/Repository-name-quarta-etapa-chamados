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
  { value: "pendente_agendamento", label: "Pendente Agendamento" },
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
  pendente_agendamento: "bg-blue-50 text-blue-700 ring-blue-200",
  orcamento: "bg-purple-50 text-purple-700 ring-purple-200",
  agendado: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  em_atendimento: "bg-orange-50 text-orange-700 ring-orange-200",
  pendente_peca: "bg-red-50 text-red-700 ring-red-200",
  resolvido: "bg-green-50 text-green-700 ring-green-200",
  faturado: "bg-emerald-900 text-emerald-50 ring-emerald-800",
  aberto: "bg-blue-50 text-blue-700 ring-blue-200",
  pendente: "bg-blue-50 text-blue-700 ring-blue-200",
  finalizado: "bg-green-50 text-green-700 ring-green-200",
  concluido: "bg-green-50 text-green-700 ring-green-200",
};

const prioridadeClasses: Record<string, string> = {
  baixa: "bg-green-50 text-green-700 ring-green-200",
  media: "bg-blue-50 text-blue-700 ring-blue-200",
  alta: "bg-orange-50 text-orange-700 ring-orange-200",
  critica: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels: Record<string, string> = {
  pendente_agendamento: "Pendente Agendamento",
  orcamento: "Orçamento",
  agendado: "Agendado",
  em_atendimento: "Em atendimento",
  pendente_peca: "Pendente Peça",
  resolvido: "Resolvido",
  faturado: "Faturado",
  aberto: "Pendente Agendamento",
  pendente: "Pendente Agendamento",
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

const badgeBaseClass =
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset";

export function getStatusClass(status: string) {
  return `${badgeBaseClass} ${
    statusClasses[status] ?? "bg-gray-50 text-gray-700 ring-gray-200"
  }`;
}

export function getPrioridadeClass(prioridade: string) {
  return `${badgeBaseClass} ${
    prioridadeClasses[prioridade] ?? "bg-gray-50 text-gray-700 ring-gray-200"
  }`;
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
