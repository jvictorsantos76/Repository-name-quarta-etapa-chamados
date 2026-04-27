const statusClasses: Record<string, string> = {
  aberto: "bg-blue-50 text-blue-700 ring-blue-200",
  agendado: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  em_atendimento: "bg-amber-50 text-amber-700 ring-amber-200",
  pendente: "bg-purple-50 text-purple-700 ring-purple-200",
  finalizado: "bg-green-50 text-green-700 ring-green-200",
  cancelado: "bg-gray-100 text-gray-700 ring-gray-300",
};

const prioridadeClasses: Record<string, string> = {
  baixa: "bg-green-50 text-green-700 ring-green-200",
  media: "bg-blue-50 text-blue-700 ring-blue-200",
  alta: "bg-orange-50 text-orange-700 ring-orange-200",
  critica: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  agendado: "Agendado",
  em_atendimento: "Em atendimento",
  pendente: "Pendente",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

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

export function getStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}

export function getPrioridadeLabel(prioridade: string) {
  return prioridadeLabels[prioridade] ?? prioridade;
}
