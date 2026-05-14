import { CatalogoChamadosPage } from "../CatalogoChamadosPage";

export default async function OrigensChamadoPage() {
  return CatalogoChamadosPage({
    kind: "origem",
    titulo: "Origem do chamado",
    descricao: "Cadastro das origens utilizadas para registrar como o chamado chegou ao atendimento.",
    tabela: "chamado_origens",
  });
}
