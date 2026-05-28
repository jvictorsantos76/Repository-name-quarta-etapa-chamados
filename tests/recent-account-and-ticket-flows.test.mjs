import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const permissionsSource = await readFile(
  new URL("../src/lib/auth/permissions.ts", import.meta.url),
  "utf8"
);
const statusFormSource = await readFile(
  new URL("../src/app/chamados/[numero]/StatusUpdateForm.tsx", import.meta.url),
  "utf8"
);
const perfilGrantMigration = await readFile(
  new URL(
    "../supabase/migrations/202605060004_perfis_self_update_cargo.sql",
    import.meta.url
  ),
  "utf8"
);
const chamadoIdentificacaoMigration = await readFile(
  new URL(
    "../supabase/migrations/202605130003_consolidate_ticket_catalogs_roles_rls.sql",
    import.meta.url
  ),
  "utf8"
);
const roleValuesMigration = await readFile(
  new URL(
    "../supabase/migrations/202605130002_add_consolidated_role_values.sql",
    import.meta.url
  ),
  "utf8"
);
const remoteSchemaMigration = await readFile(
  new URL(
    "../supabase/migrations/20260505011339_remote_schema.sql",
    import.meta.url
  ),
  "utf8"
);
const chamadoBloco1Migration = await readFile(
  new URL(
    "../supabase/migrations/202605080001_chamado_identificacao_bloco1.sql",
    import.meta.url
  ),
  "utf8"
);
const novoChamadoActionsSource = await readFile(
  new URL("../src/app/chamados/novo/actions.ts", import.meta.url),
  "utf8"
);
const novoChamadoFormSource = await readFile(
  new URL("../src/app/chamados/novo/NovoChamadoForm.tsx", import.meta.url),
  "utf8"
);
const adminUsuariosSource = await readFile(
  new URL("../src/app/admin/usuarios/page.tsx", import.meta.url),
  "utf8"
);
const pendingAccessMigration = await readFile(
  new URL(
    "../supabase/migrations/202605100001_onboarding_pending_access_governance.sql",
    import.meta.url
  ),
  "utf8"
);
const serverSupabaseSource = await readFile(
  new URL("../src/lib/supabase/server.ts", import.meta.url),
  "utf8"
);
const authConfirmSource = await readFile(
  new URL("../src/app/auth/confirm/route.ts", import.meta.url),
  "utf8"
);
const cadastroActionsSource = await readFile(
  new URL("../src/app/cadastro/actions.ts", import.meta.url),
  "utf8"
);
const cadastroPageSource = await readFile(
  new URL("../src/app/cadastro/page.tsx", import.meta.url),
  "utf8"
);
const loginPageSource = await readFile(
  new URL("../src/app/login/page.tsx", import.meta.url),
  "utf8"
);
const aguardandoAprovacaoSource = await readFile(
  new URL("../src/app/aguardando-aprovacao/page.tsx", import.meta.url),
  "utf8"
);
const aguardandoAprovacaoClientSource = await readFile(
  new URL(
    "../src/app/aguardando-aprovacao/AguardandoAprovacaoClient.tsx",
    import.meta.url
  ),
  "utf8"
);
const accessStatusRouteSource = await readFile(
  new URL("../src/app/auth/access-status/route.ts", import.meta.url),
  "utf8"
);
const accessStatusClientSource = await readFile(
  new URL("../src/lib/auth/access-status-client.ts", import.meta.url),
  "utf8"
);
const adminApprovalOnlyMigration = await readFile(
  new URL(
    "../supabase/migrations/20260512021648_restore_admin_approval_only_flow.sql",
    import.meta.url
  ),
  "utf8"
);
const aceitesLegaisUpsertMigration = await readFile(
  new URL(
    "../supabase/migrations/20260512190000_fix_aceites_legais_upsert_constraint.sql",
    import.meta.url
  ),
  "utf8"
);
const homePageSource = await readFile(
  new URL("../src/app/page.tsx", import.meta.url),
  "utf8"
);
const passwordPolicySource = await readFile(
  new URL("../src/lib/auth/password-policy.ts", import.meta.url),
  "utf8"
);
const alterarSenhaActionsSource = await readFile(
  new URL("../src/app/auth/alterar-senha/actions.ts", import.meta.url),
  "utf8"
);
const designSource = await readFile(new URL("../DESIGN.md", import.meta.url), "utf8");
const agentsSource = await readFile(new URL("../AGENTS.md", import.meta.url), "utf8");
const catalogoConfiguracaoClientSource = await readFile(
  new URL("../src/app/configurar/CatalogoConfiguracaoClient.tsx", import.meta.url),
  "utf8"
);
const catalogoChamadosPageSource = await readFile(
  new URL("../src/app/configurar/CatalogoChamadosPage.tsx", import.meta.url),
  "utf8"
);
const statusChamadosClientSource = await readFile(
  new URL(
    "../src/app/configurar/status-chamados/StatusChamadosClient.tsx",
    import.meta.url
  ),
  "utf8"
);
const versionBadgeSource = await readFile(
  new URL("../src/components/VersionBadge.tsx", import.meta.url),
  "utf8"
);
const versionSource = await readFile(
  new URL("../src/config/version.ts", import.meta.url),
  "utf8"
);
const parceirosMigration = await readFile(
  new URL(
    "../supabase/migrations/20260519205423_create_parceiros_operacionais.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosAbaGeralMigration = await readFile(
  new URL(
    "../supabase/migrations/20260520214431_padroniza_parceiros_aba_geral.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosOrganizacaoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260521011447_add_organizacao_id_to_parceiros.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosLocalizacaoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260521230941_add_parceiros_localizacao_operacional.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosAcessoOperacionalMigration = await readFile(
  new URL(
    "../supabase/migrations/20260522161651_add_parceiros_informacoes_acesso_operacional.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosEstacionamentoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260522163904_add_parceiros_estacionamento_terceiros.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosHorariosAtendimentoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260522192857_create_parceiro_horarios_atendimento.sql",
    import.meta.url
  ),
  "utf8"
);
const clientesOrganizacaoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260519235405_add_organizacao_id_to_clientes.sql",
    import.meta.url
  ),
  "utf8"
);
const chamadosOrganizacaoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260519235406_fix_chamados_organizacao_fk.sql",
    import.meta.url
  ),
  "utf8"
);
const statusInicialMigration = await readFile(
  new URL(
    "../supabase/migrations/20260520002801_normalize_default_chamado_status_code.sql",
    import.meta.url
  ),
  "utf8"
);
const parceirosPageSource = await readFile(
  new URL("../src/app/cadastros/parceiros/page.tsx", import.meta.url),
  "utf8"
);
const parceirosActionsSource = await readFile(
  new URL("../src/app/cadastros/parceiros/actions.ts", import.meta.url),
  "utf8"
);
const parceirosFormSource = await readFile(
  new URL("../src/app/cadastros/parceiros/ParceiroForm.tsx", import.meta.url),
  "utf8"
);
const parceirosLocationUtilsSource = await readFile(
  new URL("../src/app/cadastros/parceiros/location-utils.ts", import.meta.url),
  "utf8"
);

function extractArray(source, constantName) {
  let declarationStart = source.indexOf(`export const ${constantName}:`);
  if (declarationStart === -1) {
    declarationStart = source.indexOf(`const ${constantName}:`);
  }
  assert.notEqual(declarationStart, -1, `Nao foi possivel localizar ${constantName}.`);

  const arrayStart = source.indexOf("[", declarationStart);
  const arrayEnd = source.indexOf("];", arrayStart);
  assert.notEqual(arrayStart, -1, `Nao foi possivel localizar o inicio de ${constantName}.`);
  assert.notEqual(arrayEnd, -1, `Nao foi possivel localizar o fim de ${constantName}.`);

  return source.slice(arrayStart + 1, arrayEnd);
}

test("faturado ticket changes stay restricted to admin and analyst roles", () => {
  const papeisFaturado = extractArray(
    permissionsSource,
    "PAPEIS_ALTERAR_CHAMADO_FATURADO"
  );

  assert.match(papeisFaturado, /"super_admin"/);
  assert.match(papeisFaturado, /"admin"/);
  assert.match(papeisFaturado, /"analista"/);
  assert.doesNotMatch(
    papeisFaturado,
    /"(?:comercial|tecnico_quarta|tecnico_terceirizado|cliente|parceiro)"/
  );
  assert.match(
    statusFormSource,
    /statusAtual === "faturado" && !podeAlterarChamadoFaturado\(perfilAtual\.papel\)/
  );
  assert.doesNotMatch(statusFormSource, /solicitante/);
});

test("authenticated users can update only the expected self-service perfil fields", () => {
  assert.match(
    perfilGrantMigration,
    /grant update\s*\([\s\S]*telefone[\s\S]*avatar_url[\s\S]*biografia[\s\S]*cargo[\s\S]*tema_preferido[\s\S]*cor_preferida[\s\S]*fonte_escala[\s\S]*\)\s*on table public\.perfis to authenticated;/i
  );
  assert.doesNotMatch(
    perfilGrantMigration,
    /grant update\s*\([\s\S]*(?:papel|ativo|email|nome_completo|cliente_id|loja_id)[\s\S]*\)\s*on table public\.perfis to authenticated;/i
  );
});

test("ticket identification block keeps catalog tables with RLS and no physical delete policy", () => {
  for (const tableName of [
    "chamado_tipos",
    "chamado_origens",
    "grupos_atendimento",
    "bases_conhecimento",
    "chamados_bases_conhecimento",
  ]) {
    assert.match(
      chamadoIdentificacaoMigration,
      new RegExp(`alter table public\\.${tableName} enable row level security`, "i")
    );
  }

  assert.match(
    chamadoIdentificacaoMigration,
    /create table if not exists public\.chamado_status/i
  );
  assert.doesNotMatch(chamadoIdentificacaoMigration, /for delete/i);
});

test("inline ticket catalog writes are restricted to admin and analyst roles", () => {
  assert.match(roleValuesMigration, /add value if not exists 'tecnico_quarta'/i);
  assert.match(roleValuesMigration, /add value if not exists 'parceiro'/i);
  assert.match(
    chamadoIdentificacaoMigration,
    /papel(?:::text)?\s+in\s+\('super_admin', 'admin', 'analista'\)/i
  );
  assert.match(
    chamadoIdentificacaoMigration,
    /with check \(public\.usuario_catalogo_chamados_ativo\(\) and criado_por = auth\.uid\(\)\)/i
  );
  assert.match(novoChamadoActionsSource, /await requirePerfilAutenticado\(\)/);
  assert.match(novoChamadoActionsSource, /podeGerenciarCatalogosChamado/);
  assert.doesNotMatch(novoChamadoActionsSource, /perfilAtual\.papel === "solicitante"/);
});

test("new ticket form requires manual title and keeps status and number read only", () => {
  assert.match(novoChamadoFormSource, /Assunto/);
  assert.match(novoChamadoActionsSource, /Informe o Assunto do chamado\./);
  assert.match(novoChamadoFormSource, /value="Gerado após salvar"/);
  assert.match(novoChamadoFormSource, /dados\.statusPadrao\?\.nome/);
  assert.match(novoChamadoFormSource, /Base de conhecimento relacionada/);
  assert.match(novoChamadoFormSource, /\+ Novo artigo/);
  assert.match(novoChamadoFormSource, /criarChamadoIdentificacao/);
});

test("new ticket initial status uses the canonical value accepted by chamados", () => {
  assert.match(
    statusInicialMigration,
    /set codigo = 'pendente_agendamento'[\s\S]*where codigo = 'pendente_de_agendamento'/i
  );
  assert.match(novoChamadoActionsSource, /function normalizarStatusInicial/);
  assert.match(novoChamadoActionsSource, /codigo === "pendente_de_agendamento"/);
  assert.match(novoChamadoActionsSource, /return "pendente_agendamento"/);
  assert.match(
    novoChamadoActionsSource,
    /status:\s*statusInicial/
  );
});

test("admin approval uses invite or recovery links and supports manual regeneration", () => {
  assert.match(adminUsuariosSource, /inviteUserByEmail/);
  assert.match(adminUsuariosSource, /resetPasswordForEmail/);
  assert.match(adminUsuariosSource, /gerarLinkConviteManual/);
  assert.match(adminUsuariosSource, /type: "invite"/);
  assert.match(adminUsuariosSource, /gerarLinkRecuperacaoManual/);
  assert.match(adminUsuariosSource, /type: "recovery"/);
  assert.match(adminUsuariosSource, /linkAcessoManual: linkManual\.linkAcessoManual/);
  assert.match(
    adminUsuariosSource,
    /!\["aprovar", "rejeitar", "gerar_link"\]\.includes\(acao\)/
  );
});

test("pending access migration still tracks confirmation, approval and blocking states", () => {
  for (const column of [
    "user_id",
    "email_confirmado_em",
    "criado_em",
    "expira_em",
    "motivo_rejeicao",
    "bloqueado_em",
  ]) {
    assert.match(pendingAccessMigration, new RegExp(`add column if not exists ${column}`, "i"));
  }

  for (const status of [
    "pendente_confirmacao_email",
    "pendente_aprovacao",
    "aprovado",
    "rejeitado",
    "expirado",
    "cancelado",
  ]) {
    assert.match(pendingAccessMigration, new RegExp(`'${status}'`, "i"));
  }
});

test("aceites_legais upsert migration creates the unique constraint expected by onConflict", () => {
  assert.match(
    aceitesLegaisUpsertMigration,
    /add constraint aceites_legais_solicitacao_documento_key[\s\S]*unique \(solicitacao_acesso_id, tipo_documento\)/i
  );
  assert.match(
    cadastroActionsSource,
    /onConflict: "solicitacao_acesso_id,tipo_documento"/
  );
  assert.match(cadastroActionsSource, /erroAceites\?\.code === "42P10"/);
  assert.match(cadastroActionsSource, /\.from\("aceites_legais"\)\s*\.insert\(aceitesPendentes\)/);
});

test("server guards now accept only operational profiles and keep pending users awaiting approval", () => {
  assert.match(serverSupabaseSource, /auth\.getUser\(\s*accessToken\s*\)/);
  assert.match(serverSupabaseSource, /kind: "awaiting_approval"/);
  assert.match(serverSupabaseSource, /kind: "operational"/);
  assert.doesNotMatch(serverSupabaseSource, /kind: "temporary"/);
  assert.doesNotMatch(serverSupabaseSource, /reconciliarSolicitacaoTemporaria/);
  assert.match(serverSupabaseSource, /Seu cadastro foi recebido e aguarda aprovação administrativa/);
});

test("auth confirm updates only the request state and removes token from the final URL", () => {
  assert.match(authConfirmSource, /verifyOtp\(\{[\s\S]*token_hash: tokenHash[\s\S]*type: type as EmailOtpType/);
  assert.match(authConfirmSource, /status: "pendente_aprovacao"/);
  assert.match(authConfirmSource, /email_confirmado_em: agora/);
  assert.doesNotMatch(authConfirmSource, /papel: "solicitante"/);
  assert.match(authConfirmSource, /redirectTo\(request, acesso\.redirectTo\)/);
  assert.doesNotMatch(authConfirmSource, /redirectTo\(request,\s*request\.url/);
});

test("public cadastro keeps password flow, validates Supabase password policy and does not create perfil automatically", () => {
  assert.match(cadastroActionsSource, /supabase\.auth\.signUp/);
  assert.match(cadastroActionsSource, /signInWithPassword/);
  assert.match(cadastroActionsSource, /auth\.admin\.createUser/);
  assert.match(cadastroActionsSource, /falhaEnvioConfirmacaoEmail/);
  assert.match(cadastroActionsSource, /validarPoliticaSenha\(campos\.senha\)/);
  assert.match(cadastroActionsSource, /status: usaFluxoManualAdmin[\s\S]*\? "pendente_aprovacao"/);
  assert.match(cadastroActionsSource, /: "pendente_confirmacao_email"/);
  assert.match(cadastroActionsSource, /perfil_id: null/);
  assert.doesNotMatch(cadastroActionsSource, /papel: "solicitante"/);
  assert.match(cadastroPageSource, /aprovação administrativa/);
  assert.match(cadastroPageSource, /PASSWORD_POLICY_HINT/);
});

test("login keeps invalid credential protection without mixing it with pending-access guidance", () => {
  assert.match(
    loginPageSource,
    /E-mail ou senha inválidos\. Confira seus dados e tente novamente\./
  );
  assert.doesNotMatch(loginPageSource, /Acesso ainda não liberado\./);
});

test("awaiting approval page keeps logout path and only redirects operational users", () => {
  assert.match(aguardandoAprovacaoSource, /resolverAcessoAutenticado/);
  assert.match(aguardandoAprovacaoSource, /acesso\.message/);
  assert.match(aguardandoAprovacaoSource, /AguardandoAprovacaoClient/);
  assert.match(aguardandoAprovacaoClientSource, /syncSupabaseSessionCookies\(session\)/);
  assert.match(aguardandoAprovacaoClientSource, /fetchAccessStatus/);
  assert.match(accessStatusClientSource, /fetch\("\/auth\/access-status"/);
  assert.match(accessStatusClientSource, /content-type/);
  assert.match(aguardandoAprovacaoClientSource, /router\.replace\(acesso\.data\.redirectTo\)/);
  assert.doesNotMatch(aguardandoAprovacaoClientSource, /temporary/);
  assert.match(aguardandoAprovacaoSource, /href="\/auth\/logout"/);
});

test("access-status route remains the single server-side decision point", () => {
  assert.match(accessStatusRouteSource, /resolverAcessoAutenticado/);
  assert.match(accessStatusRouteSource, /redirectTo/);
  assert.match(accessStatusRouteSource, /kind/);
});

test("admin-approval-only migration disables temporary access helpers without deleting history", () => {
  assert.match(adminApprovalOnlyMigration, /status =[\s\S]*pendente_aprovacao/);
  assert.match(adminApprovalOnlyMigration, /set ativo = false/i);
  assert.match(adminApprovalOnlyMigration, /create or replace function public\.usuario_solicitacao_pendente_ativa\(\)/i);
  assert.match(adminApprovalOnlyMigration, /select false;/i);
  assert.match(adminApprovalOnlyMigration, /create or replace function public\.usuario_acesso_chamados_ativo\(\)/i);
  assert.match(adminApprovalOnlyMigration, /select public\.usuario_operacional_ativo\(\);/i);
});

test("home no longer renders temporary-access copy", () => {
  assert.match(homePageSource, /Gestão de Chamados/);
  assert.doesNotMatch(homePageSource, /Acesso temporário/);
  assert.doesNotMatch(homePageSource, /Meus chamados/);
});

test("password policy helper is reused in cadastro and authenticated password change", () => {
  assert.match(passwordPolicySource, /MIN_PASSWORD_LENGTH = 8/);
  assert.match(passwordPolicySource, /LOWERCASE_REGEX/);
  assert.match(passwordPolicySource, /UPPERCASE_REGEX/);
  assert.match(passwordPolicySource, /DIGIT_REGEX/);
  assert.match(alterarSenhaActionsSource, /validarPoliticaSenha\(senha\)/);
  assert.match(alterarSenhaActionsSource, /auth\.updateUser\(\{ password: senha \}\)/);
});

test("small configuration catalogs follow the canonical ticket status pattern", () => {
  for (const source of [designSource, agentsSource]) {
    assert.match(source, /padrão canônico de Status de Chamados/i);
    assert.match(source, /filtros visíveis/i);
    assert.match(source, /paginação local/i);
    assert.match(source, /Primeiro/i);
    assert.match(source, /Voltar/i);
    assert.match(source, /Avançar/i);
    assert.match(source, /Último/i);
    assert.match(source, /persistência/i);
  }

  assert.match(catalogoConfiguracaoClientSource, /export function CatalogoConfiguracaoClient/);
  assert.match(catalogoConfiguracaoClientSource, /export function CatalogoPaginacao/);
  assert.match(catalogoConfiguracaoClientSource, /CampoFiltroTexto/);
  assert.match(catalogoConfiguracaoClientSource, /CampoFiltroSelecao/);
  assert.match(catalogoConfiguracaoClientSource, /itensFiltrados/);
  assert.match(catalogoConfiguracaoClientSource, /itensPaginados/);

  for (const label of ["Primeiro", "Voltar", "Avançar", "Último"]) {
    assert.match(catalogoConfiguracaoClientSource, new RegExp(label));
  }

  assert.match(catalogoChamadosPageSource, /CatalogoConfiguracaoClient/);
  assert.match(statusChamadosClientSource, /CatalogoPaginacao/);
  assert.match(versionSource, /STATUS_CHAMADOS_PAGE_VERSION = "v1\.0\.0"/);
  assert.match(versionSource, /TIPOS_CHAMADO_PAGE_VERSION = "v1\.0\.0"/);
  assert.match(versionSource, /ORIGENS_CHAMADO_PAGE_VERSION = "v1\.0\.0"/);
  assert.match(versionSource, /GRUPOS_ATENDIMENTO_PAGE_VERSION = "v1\.0\.0"/);
  assert.match(versionBadgeSource, /\/configurar\/status-chamados/);
  assert.match(versionBadgeSource, /\/configurar\/tipos-chamado/);
  assert.match(versionBadgeSource, /\/configurar\/origens-chamado/);
  assert.match(versionBadgeSource, /\/configurar\/grupos-atendimento/);
});

test("operational partners module keeps legacy compatibility and guarded RLS", () => {
  for (const tabela of [
    "parceiros",
    "parceiros_enderecos",
    "parceiros_contatos",
    "parceiros_filiais",
    "parceiros_financeiro",
    "parceiros_operacional",
    "parceiros_contratos",
    "parceiros_anexos",
    "parceiros_historico",
  ]) {
    assert.match(parceirosMigration, new RegExp(`create table if not exists public\\.${tabela}`, "i"));
    assert.match(parceirosMigration, new RegExp(`alter table public\\.${tabela} enable row level security`, "i"));
    assert.match(parceirosMigration, new RegExp(`grant .* on table public\\.${tabela} to authenticated`, "i"));
    assert.match(parceirosMigration, new RegExp(`grant .* on table public\\.${tabela} to service_role`, "i"));
    assert.match(parceirosMigration, new RegExp(`revoke delete on table public\\.${tabela} from authenticated`, "i"));
  }

  assert.match(parceirosMigration, /cliente_legado_id uuid null references public\.clientes\(id\)/i);
  assert.match(parceirosMigration, /loja_legado_id uuid null references public\.lojas\(id\)/i);
  assert.match(parceirosMigration, /add column if not exists parceiro_id uuid null references public\.parceiros\(id\)/i);
  assert.match(parceirosMigration, /add column if not exists parceiro_filial_id uuid null references public\.parceiros_filiais\(id\)/i);
  assert.doesNotMatch(parceirosMigration, /add column if not exists filial_id/i);
  assert.match(parceirosMigration, /insert into public\.parceiros[\s\S]*where not exists/i);
  assert.match(parceirosMigration, /insert into public\.parceiros_filiais[\s\S]*where not exists/i);
  assert.match(parceirosMigration, /insert into storage\.buckets \(id, name, public\)[\s\S]*'parceiros-anexos'/i);
  assert.match(parceirosMigration, /name like 'parceiros\/%'/i);

  assert.match(novoChamadoActionsSource, /parceiro_id: parceiroId/);
  assert.match(novoChamadoActionsSource, /parceiro_filial_id: parceiroFilialId/);
  assert.match(parceirosPageSource, /organizações seguem como agrupamento interno/i);
  assert.match(parceirosPageSource, /cliente_legado_nome/);
  assert.match(parceirosPageSource, /filiais_count/);
  assert.match(versionSource, /PARCEIROS_PAGE_VERSION = "v1\.1\.24"/);
  assert.match(versionBadgeSource, /\/cadastros\/parceiros/);

  assert.match(parceirosAbaGeralMigration, /add column if not exists tipo_pessoa text null/i);
  assert.match(parceirosAbaGeralMigration, /add column if not exists tipo_contato text null/i);
  assert.match(parceirosAbaGeralMigration, /tipo_parceiro in \([\s\S]*'prestador'[\s\S]*'interno'[\s\S]*'prospect'/i);
  assert.match(parceirosAbaGeralMigration, /situacao in \([\s\S]*'implantacao'[\s\S]*'suspenso'[\s\S]*'encerrado'/i);
  assert.doesNotMatch(parceirosAbaGeralMigration, /disable row level security|drop policy|grant .* to anon|revoke delete/i);

  assert.match(parceirosOrganizacaoMigration, /add column if not exists organizacao_id uuid null/i);
  assert.match(parceirosOrganizacaoMigration, /foreign key \(organizacao_id\) references public\.organizacoes\(id\)/i);
  assert.match(parceirosOrganizacaoMigration, /where p\.organizacao_id is null[\s\S]*p\.cliente_legado_id = c\.id/i);
  assert.doesNotMatch(parceirosOrganizacaoMigration, /disable row level security|drop policy|grant .* to anon|revoke delete/i);
  assert.match(parceirosActionsSource, /formData\.get\("organizacao_id_alterado"\) === "1"/);
  assert.match(parceirosFormSource, /criar_organizacao_vinculada/);
  assert.match(parceirosActionsSource, /formData\.get\("criar_organizacao_vinculada"\) === "on"/);
  assert.match(parceirosActionsSource, /\.from\("organizacoes"\)[\s\S]*\.insert\(\{/);
  assert.match(parceirosActionsSource, /\.from\("clientes"\)[\s\S]*\.update\(\{ organizacao_id: organizacaoId \}\)/);
});

test("partner operational location keeps address independent and route links external", () => {
  for (const column of [
    "latitude",
    "longitude",
    "origem_geolocalizacao",
    "link_maps",
    "localizacao_referencia",
    "observacoes_acesso",
    "ponto_referencia",
    "restricoes_entrada",
    "estacionamento",
    "portaria_recepcao",
    "doca_carga_descarga",
    "documento_necessario_entrada",
    "responsavel_local",
    "telefone_responsavel_local",
    "necessita_autorizacao_previa",
    "horario_funcionamento",
    "horario_atendimento_tecnico",
    "horario_coleta_entrega",
    "atendimento_sabado",
    "atendimento_domingo",
    "atendimento_feriado",
    "necessita_agendamento",
    "prazo_minimo_agendamento",
    "observacoes_operacionais",
  ]) {
    assert.match(
      parceirosLocalizacaoMigration,
      new RegExp(`add column if not exists ${column}`, "i")
    );
  }

  assert.doesNotMatch(
    parceirosLocalizacaoMigration,
    /not null|default|disable row level security|drop policy|grant|revoke|create table|create trigger/i
  );
  assert.match(parceirosActionsSource, /coordenadaOuNull\(formData\.get\("latitude"\), -90, 90, "Latitude"\)/);
  assert.match(parceirosActionsSource, /coordenadaOuNull\(formData\.get\("longitude"\), -180, 180, "Longitude"\)/);
  assert.doesNotMatch(
    parceirosActionsSource,
    /const enderecoPayload = \{[\s\S]*latitude: numeroOuNull\(formData\.get\("latitude"\)\)[\s\S]*\};/
  );
  assert.match(parceirosLocationUtilsSource, /GOOGLE_AT_COORDENADA_REGEX/);
  assert.match(parceirosLocationUtilsSource, /if \(!texto\) \{\s*return null;\s*\}/);
  assert.match(parceirosLocationUtilsSource, /https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.match(parceirosLocationUtilsSource, /https:\/\/maps\.google\.com\/maps\?q=/);
  assert.match(parceirosLocationUtilsSource, /output=embed/);
  assert.match(parceirosFormSource, /Preview do mapa operacional/);
  assert.match(parceirosFormSource, /atualizarPreviewMapa/);
  assert.match(parceirosFormSource, /Iniciar rota/);
  assert.match(parceirosFormSource, /montarMapaEmbed/);
  assert.match(parceirosFormSource, /<iframe/);
  assert.match(parceirosFormSource, /Conferir/);
  assert.match(parceirosFormSource, /Informações de acesso/);
  assert.match(parceirosFormSource, /responsavel_local_contato_id/);
  assert.match(parceirosFormSource, /Estacionamento privativo/);
  assert.match(parceirosFormSource, /Estacionamento de terceiros/);
  assert.match(parceirosFormSource, /estacionamento_terceiros_nome/);
  assert.match(parceirosFormSource, /estacionamento_terceiros_endereco/);
  assert.match(parceirosFormSource, /estacionamento_terceiros_valores/);
  assert.match(parceirosFormSource, /DOCUMENTOS_ENTRADA\.map/);
  assert.match(parceirosFormSource, /Abrir WhatsApp/);
  assert.match(parceirosFormSource, /Identificação da doca/);
  assert.doesNotMatch(parceirosFormSource, /name="restricoes_entrada"/);
  assert.match(parceirosFormSource, /Horários de atendimento/);
  assert.match(parceirosFormSource, /maps\.app\.goo\.gl/);
  assert.match(parceirosFormSource, /parceiro\?\.link_maps \?\?[\s\S]*parceiro\?\.localizacao_referencia \?\?/);
  assert.match(parceirosFormSource, /latitude: coordenadas \? String\(coordenadas\.latitude\) : ""/);
  assert.match(parceirosFormSource, /longitude: coordenadas \? String\(coordenadas\.longitude\) : ""/);
  assert.match(parceirosFormSource, /type="hidden" name="latitude" value=\{latitudeDerivada\}/);
  assert.match(parceirosFormSource, /type="hidden" name="longitude" value=\{longitudeDerivada\}/);
  assert.match(parceirosFormSource, /Latitude derivada/);
  assert.match(parceirosFormSource, /inline-flex min-h-7 max-w-full/);
  assert.doesNotMatch(parceirosFormSource, /Copiar coordenadas/);
  assert.doesNotMatch(parceirosFormSource, /Interpretar localização/);
  for (const column of [
    "responsavel_local_nome",
    "responsavel_local_contato_id",
    "responsavel_local_telefone",
    "responsavel_local_whatsapp",
    "possui_portaria_recepcao",
    "possui_doca_carga_descarga",
    "identificacao_doca",
    "documentos_entrada",
  ]) {
    assert.match(
      parceirosAcessoOperacionalMigration,
      new RegExp(`add column if not exists ${column}`, "i")
    );
  }

  assert.match(parceirosAcessoOperacionalMigration, /on delete set null/i);
  assert.match(parceirosAcessoOperacionalMigration, /set responsavel_local_nome = responsavel_local/i);
  assert.doesNotMatch(
    parceirosAcessoOperacionalMigration,
    /drop column|disable row level security|drop policy|grant .* to anon|revoke delete/i
  );
  for (const column of [
    "estacionamento_privativo",
    "estacionamento_terceiros",
    "estacionamento_terceiros_nome",
    "estacionamento_terceiros_endereco",
    "estacionamento_terceiros_valores",
  ]) {
    assert.match(
      parceirosEstacionamentoMigration,
      new RegExp(`add column if not exists ${column}`, "i")
    );
  }

  assert.match(parceirosEstacionamentoMigration, /set estacionamento_privativo = true/i);
  assert.doesNotMatch(
    parceirosEstacionamentoMigration,
    /drop column|disable row level security|drop policy|grant .* to anon|revoke delete/i
  );
  assert.match(versionSource, /PARCEIROS_PAGE_VERSION = "v1\.1\.24"/);
});

test("partner general tab keeps compact canonical large-form layout", () => {
  assert.doesNotMatch(parceirosFormSource, /min-h-\[5\.75rem\]/);
  assert.match(parceirosFormSource, /feedbackConsultaClass/);
  assert.match(parceirosFormSource, /htmlFor="cnpj_cpf"[\s\S]*Consultar CNPJ[\s\S]*id="cnpj_cpf"/);
  assert.match(parceirosFormSource, /font-\[Arial\] text-\[11px\] font-semibold uppercase leading-\[inherit\]/);
  assert.match(parceirosFormSource, /whitespace-nowrap/);
  assert.match(parceirosFormSource, /gridClassName=\{dadosCadastraisGrid\}/);
  assert.match(parceirosFormSource, /flex items-baseline justify-between gap-3/);
  assert.doesNotMatch(parceirosFormSource, /absolute left-0 top-full inline-flex w-fit text-blue-700/);
  assert.match(parceirosFormSource, /grid gap-x-4 gap-y-\[1\.2rem\] md:grid-cols-2/);
  assert.doesNotMatch(parceirosFormSource, /sm:w-40/);
  assert.doesNotMatch(parceirosFormSource, /disabled=\{!cnpjConsultavel \|\| consultandoCnpj\}/);
  assert.match(parceirosFormSource, /htmlFor="cep"[\s\S]*id="cep"[\s\S]*Buscar CEP/);
  assert.match(parceirosFormSource, /CampoSelectEditavel/);
  assert.match(parceirosFormSource, /name="contato_celular"[\s\S]*name="contato_celular_whatsapp"/);
  assert.match(parceirosFormSource, /name="responsavel_local_telefone"[\s\S]*name="responsavel_local_whatsapp"/);
  assert.match(parceirosFormSource, /Criar organização ao salvar/);
  assert.match(
    parceirosFormSource,
    /type="checkbox"[\s\S]*name="criar_organizacao_vinculada"/
  );
  assert.match(parceirosFormSource, /inline-flex h-\[17px\][\s\S]*uppercase leading-\[17px\]/);
  assert.match(parceirosFormSource, /name="criar_organizacao_vinculada"[\s\S]*h-\[17px\] w-\[17px\]/);
  assert.match(parceirosFormSource, /flex items-end justify-between gap-3[\s\S]*Organização vinculada/);
  assert.doesNotMatch(parceirosFormSource, /criarOrganizacaoVinculada/);
  assert.match(parceirosActionsSource, /valorContatoEditavel/);
  assert.match(parceirosActionsSource, /opcao === "outro"/);
  assert.doesNotMatch(parceirosFormSource, /densidade === "confortavel" \? "compacto" : densidade/);
  assert.match(parceirosFormSource, /grid gap-x-3 gap-y-2 md:grid-cols-3/);
  assert.match(parceirosFormSource, /rows = 3/);
});

test("partner service hours use weekly structured agenda without deleting legacy columns", () => {
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /create table if not exists public\.parceiro_horarios_atendimento/i
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /parceiro_id uuid not null references public\.parceiros\(id\) on delete cascade/i
  );
  assert.match(parceirosHorariosAtendimentoMigration, /dia_semana smallint not null/i);
  assert.match(parceirosHorariosAtendimentoMigration, /fechado boolean not null default false/i);
  assert.match(parceirosHorariosAtendimentoMigration, /abre_as time null/i);
  assert.match(parceirosHorariosAtendimentoMigration, /fecha_as time null/i);
  assert.match(parceirosHorariosAtendimentoMigration, /ordem smallint not null default 1/i);
  assert.match(parceirosHorariosAtendimentoMigration, /dia_semana between 0 and 6/i);
  assert.match(parceirosHorariosAtendimentoMigration, /fecha_as > abre_as/i);
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /unique \(\s*parceiro_id,\s*dia_semana,\s*ordem\s*\)/i
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /alter table public\.parceiro_horarios_atendimento enable row level security/i
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /grant select, insert, update on table public\.parceiro_horarios_atendimento to authenticated/i
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /revoke all on table public\.parceiro_horarios_atendimento from anon/i
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /revoke delete on table public\.parceiro_horarios_atendimento from authenticated/i
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /public\.usuario_catalogo_chamados_ativo\(\)/
  );
  assert.match(
    parceirosHorariosAtendimentoMigration,
    /public\.usuario_acesso_chamados_ativo\(\)/
  );

  assert.match(parceirosFormSource, /AgendaSemanalAtendimento/);
  assert.match(parceirosFormSource, /DIAS_ATENDIMENTO/);
  assert.match(parceirosFormSource, /horarios_atendimento_json/);
  assert.match(parceirosFormSource, /"09:00"/);
  assert.match(parceirosFormSource, /"17:00"/);
  assert.match(parceirosFormSource, /Não é permitido|não podem se sobrepor/);
  assert.match(parceirosActionsSource, /montarHorariosAtendimento/);
  assert.match(parceirosActionsSource, /salvarHorariosAtendimento/);
  assert.match(parceirosActionsSource, /\.from\("parceiro_horarios_atendimento"\)[\s\S]*\.delete\(\)/);
  assert.match(parceirosActionsSource, /\.from\("parceiro_horarios_atendimento"\)[\s\S]*\.insert\(/);
  assert.doesNotMatch(parceirosFormSource, /name="horario_funcionamento"/);
  assert.doesNotMatch(parceirosFormSource, /name="horario_atendimento_tecnico"/);
  assert.doesNotMatch(parceirosFormSource, /name="horario_coleta_entrega"/);
  assert.doesNotMatch(parceirosFormSource, /name="prazo_minimo_agendamento"/);
  assert.doesNotMatch(parceirosFormSource, /name="atendimento_sabado"/);
  assert.doesNotMatch(parceirosFormSource, /name="atendimento_domingo"/);
});

test("organizations link to clients without replacing operational ticket fields", () => {
  assert.match(
    clientesOrganizacaoMigration,
    /add column if not exists organizacao_id uuid null/i
  );
  assert.match(
    clientesOrganizacaoMigration,
    /foreign key \(organizacao_id\) references public\.organizacoes\(id\)/i
  );
  assert.match(
    clientesOrganizacaoMigration,
    /lower\(btrim\(c\.nome_fantasia\)\) = lower\(btrim\(o\.nome\)\)/i
  );
  assert.match(
    clientesOrganizacaoMigration,
    /correspondencias\.total_correspondencias = 1/i
  );
  assert.doesNotMatch(clientesOrganizacaoMigration, /ilike|similarity|unaccent/i);
  assert.match(
    clientesOrganizacaoMigration,
    /grant select, references on table public\.organizacoes to authenticated;/i
  );
  assert.match(
    clientesOrganizacaoMigration,
    /grant select, references on table public\.organizacoes to service_role;/i
  );
  assert.match(
    clientesOrganizacaoMigration,
    /grant select, insert, update on table public\.clientes to service_role;/i
  );
  assert.match(
    clientesOrganizacaoMigration,
    /revoke delete on table public\.clientes from anon, authenticated, service_role;/i
  );

  assert.match(
    chamadosOrganizacaoMigration,
    /drop constraint if exists chamados_organizacao_id_fkey/i
  );
  assert.match(
    chamadosOrganizacaoMigration,
    /set organizacao_id = clientes\.organizacao_id/i
  );
  assert.match(
    chamadosOrganizacaoMigration,
    /set organizacao_id = null/i
  );
  assert.match(
    chamadosOrganizacaoMigration,
    /foreign key \(organizacao_id\) references public\.organizacoes\(id\)/i
  );
  assert.doesNotMatch(
    chamadosOrganizacaoMigration,
    /foreign key \(organizacao_id\) references public\.clientes\(id\)/i
  );
  assert.match(
    chamadosOrganizacaoMigration,
    /and l\.cliente_id = chamados\.cliente_id/i
  );
  assert.doesNotMatch(
    chamadosOrganizacaoMigration,
    /l\.cliente_id = chamados\.organizacao_id/i
  );

  assert.match(novoChamadoActionsSource, /cliente_id: clienteIdEfetivo/);
  assert.match(novoChamadoActionsSource, /organizacao_id:[\s\S]*clienteResposta\.data/);
  assert.match(novoChamadoActionsSource, /parceiro_mestre/);
  assert.match(novoChamadoActionsSource, /parceiro_filial/);
  assert.doesNotMatch(novoChamadoActionsSource, /organizacao_id: clienteIdEfetivo/);
  assert.match(novoChamadoActionsSource, /lojaResposta\.data\.cliente_id !== clienteIdEfetivo/);
  assert.match(novoChamadoFormSource, /Organização administrativa:/);
  assert.match(novoChamadoFormSource, /Cadastro mestre:/);
  assert.match(novoChamadoFormSource, /Filial no cadastro mestre:/);
  assert.doesNotMatch(novoChamadoFormSource, /organizacao_id: clienteId/);
  assert.match(versionSource, /ORGANIZACOES_PAGE_VERSION = "v1\.1\.1"/);
  assert.match(versionSource, /NOVO_CHAMADO_PAGE_VERSION = "v0\.2\.7"/);
  assert.match(versionBadgeSource, /\/cadastros\/organizacoes/);
});

test("partner form normalizes website before hitting database constraints", () => {
  assert.match(parceirosActionsSource, /function normalizarWebsite/);
  assert.match(parceirosActionsSource, /`https:\/\/\$\{texto\}`/);
  assert.match(parceirosActionsSource, /parceiros_website_check/);
  assert.match(
    parceirosActionsSource,
    /Informe o website com http:\/\/ ou https:\/\/\./
  );
  assert.match(parceirosActionsSource, /mensagemErroParceiro\(parceiroResposta\.error\)/);
});

test("legacy reset migrations keep function dependency and catalog helper valid", () => {
  const dropDefaultIndex = remoteSchemaMigration.indexOf(
    'alter column "expira_em" drop default'
  );
  const dropFunctionIndex = remoteSchemaMigration.indexOf(
    'drop function if exists "public"."calcular_expiracao_horas_uteis"'
  );

  assert.ok(dropDefaultIndex > -1);
  assert.ok(dropFunctionIndex > -1);
  assert.ok(dropDefaultIndex < dropFunctionIndex);
  assert.match(
    chamadoBloco1Migration,
    /select exists \([\s\S]*and papel::text in \('super_admin', 'admin', 'gestor', 'analista'\)[\s\S]*\);\s*\$function\$/i
  );
});
