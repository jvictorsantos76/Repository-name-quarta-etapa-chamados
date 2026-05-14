import { CatalogoChamadosPage } from "../CatalogoChamadosPage";

export default async function TiposChamadoPage() {
  return CatalogoChamadosPage({
    kind: "tipo",
    titulo: "Tipos de chamado",
    descricao: "Cadastro dos tipos usados para classificar chamados técnicos.",
    tabela: "chamado_tipos",
  });
}
