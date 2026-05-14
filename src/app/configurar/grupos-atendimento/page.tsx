import { CatalogoChamadosPage } from "../CatalogoChamadosPage";

export default async function GruposAtendimentoPage() {
  return CatalogoChamadosPage({
    kind: "grupo",
    titulo: "Grupos de atendimento",
    descricao: "Cadastro dos grupos responsáveis pelo direcionamento operacional dos chamados.",
    tabela: "grupos_atendimento",
  });
}
