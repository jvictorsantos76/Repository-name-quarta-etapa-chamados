import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const changelogPath = resolve(root, "src/config/changelog.json");
const versionPath = resolve(root, "src/config/version.ts");
const packagePath = resolve(root, "package.json");
const outputPath = resolve(root, "CHANGELOG.md");

const changelog = JSON.parse(readFileSync(changelogPath, "utf8"));
const versionSource = readFileSync(versionPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

function getExportedConst(name) {
  const match = versionSource.match(new RegExp(`export const ${name} = "([^"]+)"`));
  return match?.[1] ?? "desconhecido";
}

function formatDate(date) {
  const [day, month, year] = date.split("/");
  if (!day || !month || !year) {
    return date;
  }
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function section(title, items) {
  if (!items || items.length === 0) {
    return "";
  }

  return [`### ${title}`, "", ...items.map((item) => `- ${item}`), ""].join("\n");
}

const appVersion = getExportedConst("APP_VERSION");
const appUpdatedAt = getExportedConst("APP_UPDATED_AT");

const pageVersions = [
  ["Dashboard", "DASHBOARD_PAGE_VERSION"],
  ["Login", "LOGIN_PAGE_VERSION"],
  ["Cadastro de usuario", "CADASTRO_USUARIO_PAGE_VERSION"],
  ["Solicitacoes de acesso", "SOLICITACOES_ACESSO_PAGE_VERSION"],
  ["Perfil de usuario", "PERFIL_USUARIO_PAGE_VERSION"],
  ["Conta", "CONTA_PAGE_VERSION"],
  ["Conta / Perfil", "CONTA_PERFIL_PAGE_VERSION"],
  ["Conta / Aparencia", "CONTA_APARENCIA_PAGE_VERSION"],
  ["Conta / Permissoes", "CONTA_PERMISSOES_PAGE_VERSION"],
  ["Novo chamado", "NOVO_CHAMADO_PAGE_VERSION"],
  ["Status de chamados", "STATUS_CHAMADOS_PAGE_VERSION"],
  ["Status de artigos", "STATUS_ARTIGOS_PAGE_VERSION"],
  ["Tipos de chamado", "TIPOS_CHAMADO_PAGE_VERSION"],
  ["Tipos de artigo", "TIPOS_ARTIGO_PAGE_VERSION"],
  ["Origens de chamado", "ORIGENS_CHAMADO_PAGE_VERSION"],
  ["Grupos de atendimento", "GRUPOS_ATENDIMENTO_PAGE_VERSION"],
  ["SLAs", "SLAS_PAGE_VERSION"],
  ["Calendarios de SLA / Horarios de funcionamento", "CALENDARIOS_SLA_PAGE_VERSION"],
  ["Organizacoes", "ORGANIZACOES_PAGE_VERSION"],
  ["Clientes / Parceiros", "PARCEIROS_PAGE_VERSION"],
  ["Contratos", "CONTRATOS_PAGE_VERSION"],
  ["Base de conhecimento", "BASE_CONHECIMENTO_PAGE_VERSION"],
  ["Documentos legais", "LEGAL_DOCUMENTS_VERSION"],
];

const lines = [
  "# Changelog",
  "",
  "Historico versionavel do projeto `quarta-etapa-chamados`.",
  "",
  "Este arquivo e gerado a partir de `src/config/changelog.json`. Nao edite manualmente.",
  "",
  "## Fontes Validadas",
  "",
  "- `src/config/changelog.json`: fonte unica das entradas do changelog.",
  "- `src/app/changelog/page.tsx`: renderiza o changelog visivel da aplicacao.",
  "- `src/config/version.ts`: contem a versao global e as versoes por tela.",
  "- `src/components/VersionBadge.tsx`: exibe a versao global, a versao da tela atual e links para Changelog/Roadmap.",
  "- `src/config/navigation.ts`: inclui entrada de navegacao para `/changelog`.",
  "- `package.json`: contem a versao tecnica do pacote, atualmente diferente da versao operacional visivel.",
  "",
  "## Estado Atual",
  "",
  `- Versao operacional visivel: \`${appVersion}\``,
  `- Publicada em: \`${appUpdatedAt}\``,
  `- Versao tecnica do pacote: \`${packageJson.version}\``,
  "- Rota visivel: `/changelog`",
  "",
  "> Nota: neste projeto, `APP_VERSION` em `src/config/version.ts` e a rota `/changelog` representam o versionamento operacional visivel. A versao de `package.json` nao esta sincronizada com esse historico.",
  "",
  "## Versoes por Area",
  "",
  "| Area | Versao |",
  "|---|---|",
  ...pageVersions.map(([label, constName]) => `| ${label} | \`${getExportedConst(constName)}\` |`),
  "",
];

for (const entry of changelog) {
  lines.push(`## ${entry.versao} - ${formatDate(entry.data)}`, "");
  const alteracoes = section("Alterado", entry.alteracoes);
  const correcoes = section("Corrigido", entry.correcoes);

  if (alteracoes) {
    lines.push(alteracoes.trimEnd(), "");
  }
  if (correcoes) {
    lines.push(correcoes.trimEnd(), "");
  }
}

lines.push(
  "## Regras de manutencao",
  "",
  "- Atualizar `src/config/changelog.json` quando `APP_VERSION` for alterada.",
  "- Rodar `npm run changelog:generate` para regenerar este arquivo.",
  "- Manter este arquivo coerente com `/changelog`.",
  "- Registrar alteracoes visiveis, correcoes, migrations relevantes e impactos de RLS/autorizacao.",
  "- Nao registrar secrets, chaves, dados pessoais ou detalhes sensiveis de ambiente.",
  "- Quando houver divergencia entre `package.json` e `APP_VERSION`, explicitar qual versao representa a entrega operacional.",
  "",
);

writeFileSync(outputPath, `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}`, "utf8");
console.log(`Generated ${outputPath} from ${changelogPath} (${changelog.length} entries).`);
