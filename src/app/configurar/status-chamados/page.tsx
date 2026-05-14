import { CatalogoChamadosPage } from "../CatalogoChamadosPage";

export default async function StatusChamadosPage() {
  return CatalogoChamadosPage({
    kind: "status",
    titulo: "Status de chamados",
    descricao: "Cadastro operacional dos status usados no ciclo de vida dos chamados.",
    tabela: "chamado_status",
  });
}
