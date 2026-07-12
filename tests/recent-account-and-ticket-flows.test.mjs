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
const statusArtigosActionsSource = await readFile(
  new URL("../src/app/configurar/status-artigos/actions.ts", import.meta.url),
  "utf8"
);
const tiposArtigoActionsSource = await readFile(
  new URL("../src/app/configurar/tipos-artigo/actions.ts", import.meta.url),
  "utf8"
);
const versionBadgeSource = await readFile(
  new URL("../src/components/VersionBadge.tsx", import.meta.url),
  "utf8"
);
const navigationSource = await readFile(
  new URL("../src/config/navigation.ts", import.meta.url),
  "utf8"
);
const versionSource = await readFile(
  new URL("../src/config/version.ts", import.meta.url),
  "utf8"
);
const changelogSource = await readFile(
  new URL("../src/app/changelog/page.tsx", import.meta.url),
  "utf8"
);
const contratosPageSource = await readFile(
  new URL("../src/app/cadastros/contratos/page.tsx", import.meta.url),
  "utf8"
);
const contratosNovoPageSource = await readFile(
  new URL("../src/app/cadastros/contratos/novo/page.tsx", import.meta.url),
  "utf8"
);
const contratosEditarPageSource = await readFile(
  new URL("../src/app/cadastros/contratos/[id]/page.tsx", import.meta.url),
  "utf8"
);
const contratosClientSource = await readFile(
  new URL("../src/app/cadastros/contratos/ContratosClient.tsx", import.meta.url),
  "utf8"
);
const contratosActionsSource = await readFile(
  new URL("../src/app/cadastros/contratos/actions.ts", import.meta.url),
  "utf8"
);
const contratosCamposMigration = await readFile(
  new URL(
    "../supabase/migrations/20260610030235_add_campos_cadastro_contratos.sql",
    import.meta.url
  ),
  "utf8"
);
const contratosCobrancaMigration = await readFile(
  new URL(
    "../supabase/migrations/20260610031840_add_cliente_cobranca_contratos.sql",
    import.meta.url
  ),
  "utf8"
);
const contratosRenovacaoMigration = await readFile(
  new URL(
    "../supabase/migrations/20260610033611_add_renovacao_automatica_contratos.sql",
    import.meta.url
  ),
  "utf8"
);
const configurarSlasMigration = await readFile(
  new URL(
    "../supabase/migrations/202606120001_configurar_slas_mvp.sql",
    import.meta.url
  ),
  "utf8"
);
const slasPageSource = await readFile(
  new URL("../src/app/configurar/slas/page.tsx", import.meta.url),
  "utf8"
);
const slasClientSource = await readFile(
  new URL("../src/app/configurar/slas/SlaClient.tsx", import.meta.url),
  "utf8"
);
const slasActionsSource = await readFile(
  new URL("../src/app/configurar/slas/actions.ts", import.meta.url),
  "utf8"
);
const calendariosSlaPageSource = await readFile(
  new URL("../src/app/configurar/slas/calendarios/page.tsx", import.meta.url),
  "utf8"
);
const calendariosSlaClientSource = await readFile(
  new URL(
    "../src/app/configurar/slas/calendarios/CalendariosSlaClient.tsx",
    import.meta.url
  ),
  "utf8"
);
const calendariosAtendimentoMigration = await readFile(
  new URL(
    "../supabase/migrations/202607080001_create_calendarios_atendimento.sql",
    import.meta.url
  ),
  "utf8"
);
const horariosFuncionamentoParceirosMigration = await readFile(
  new URL(
    "../supabase/migrations/202607080002_unifica_horarios_funcionamento_parceiros.sql",
    import.meta.url
  ),
  "utf8"
);
const agendaSemanalSource = await readFile(
  new URL("../src/lib/agenda-semanal.ts", import.meta.url),
  "utf8"
);
const agendaSemanalComponentSource = await readFile(
  new URL("../src/components/AgendaSemanalAtendimento.tsx", import.meta.url),
  "utf8"
);
const organizacaoDetalhePageSource = await readFile(
  new URL("../src/app/cadastros/organizacoes/[id]/page.tsx", import.meta.url),
  "utf8"
);
const organizacaoFiliaisSectionSource = await readFile(
  new URL(
    "../src/app/cadastros/organizacoes/OrganizacaoFiliaisSection.tsx",
    import.meta.url
  ),
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
const parceiroDetailPageSource = await readFile(
  new URL("../src/app/cadastros/parceiros/[id]/page.tsx", import.meta.url),
  "utf8"
);
const parceiroNovaPageSource = await readFile(
  new URL("../src/app/cadastros/parceiros/nova/page.tsx", import.meta.url),
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
const parceirosTypesSource = await readFile(
  new URL("../src/app/cadastros/parceiros/types.ts", import.meta.url),
  "utf8"
);
const parceirosLocationUtilsSource = await readFile(
  new URL("../src/app/cadastros/parceiros/location-utils.ts", import.meta.url),
  "utf8"
);
const filiaisTabSource = parceirosFormSource.slice(
  parceirosFormSource.indexOf("function FiliaisTab"),
  parceirosFormSource.indexOf("function ContatosTab")
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
  assert.match(versionSource, /STATUS_CHAMADOS_PAGE_VERSION = "v1\.0\.1"/);
  assert.match(versionSource, /TIPOS_CHAMADO_PAGE_VERSION = "v1\.0\.1"/);
  assert.match(versionSource, /ORIGENS_CHAMADO_PAGE_VERSION = "v1\.0\.1"/);
  assert.match(versionSource, /GRUPOS_ATENDIMENTO_PAGE_VERSION = "v1\.0\.1"/);
  assert.match(versionBadgeSource, /\/configurar\/status-chamados/);
  assert.match(versionBadgeSource, /\/configurar\/tipos-chamado/);
  assert.match(versionBadgeSource, /\/configurar\/origens-chamado/);
  assert.match(versionBadgeSource, /\/configurar\/grupos-atendimento/);
});

test("article catalog updates keep technical codes stable", () => {
  assert.match(statusArtigosActionsSource, /obterCodigoStatusExistente/);
  assert.match(statusArtigosActionsSource, /input\.id\s*\?\s*await obterCodigoStatusExistente\(input\.id\)/);
  assert.match(tiposArtigoActionsSource, /obterCodigoTipoExistente/);
  assert.match(tiposArtigoActionsSource, /id\s*\?\s*await obterCodigoTipoExistente\(id\)/);
  assert.match(versionSource, /STATUS_ARTIGOS_PAGE_VERSION = "v1\.0\.1"/);
  assert.match(versionSource, /TIPOS_ARTIGO_PAGE_VERSION = "v1\.0\.1"/);
});

test("sla configuration mvp keeps conservative data model and guarded pages", () => {
  for (const tabela of [
    "calendarios_sla",
    "calendarios_sla_horarios",
    "slas",
    "sla_versoes",
    "sla_metas",
  ]) {
    assert.match(
      configurarSlasMigration,
      new RegExp(`create table if not exists public\\.${tabela}`, "i")
    );
    assert.match(
      configurarSlasMigration,
      new RegExp(`alter table public\\.${tabela} enable row level security`, "i")
    );
    assert.match(
      configurarSlasMigration,
      new RegExp(`revoke all on table public\\.${tabela} from anon`, "i")
    );
    assert.match(
      configurarSlasMigration,
      new RegExp(`revoke delete on table public\\.${tabela} from authenticated`, "i")
    );
  }

  assert.match(configurarSlasMigration, /usuario_acesso_chamados_ativo\(\)/);
  assert.match(configurarSlasMigration, /usuario_catalogo_chamados_ativo\(\)/);
  assert.match(configurarSlasMigration, /add column if not exists sla_id uuid null references public\.slas/);
  assert.match(configurarSlasMigration, /add column if not exists sla_padrao_id uuid null references public\.slas/);
  assert.doesNotMatch(configurarSlasMigration, /chamados_sla_snapshot/);
  assert.doesNotMatch(configurarSlasMigration, /chamados_sla_eventos/);

  assert.match(navigationSource, /id: "configurar-slas"[\s\S]*href: "\/configurar\/slas"/);
  assert.match(navigationSource, /id: "configurar-slas"[\s\S]*status: "disponivel"/);
  assert.match(
    navigationSource,
    /id: "configurar-calendarios-sla"[\s\S]*href: "\/configurar\/slas\/calendarios"/
  );
  assert.match(
    navigationSource,
    /id: "configurar-calendarios-sla"[\s\S]*label: "Horários de Funcionamento"/
  );
  assert.match(
    navigationSource,
    /id: "configurar-calendarios-sla"[\s\S]*status: "disponivel"/
  );
  assert.match(versionSource, /APP_VERSION = "v0\.9\.71"/);
  assert.match(versionSource, /SLAS_PAGE_VERSION = "v1\.0\.0"/);
  assert.match(versionSource, /CALENDARIOS_SLA_PAGE_VERSION = "v1\.0\.1"/);
  assert.match(versionBadgeSource, /\/configurar\/slas/);
  assert.match(versionBadgeSource, /\/configurar\/slas\/calendarios/);
  assert.match(versionBadgeSource, /Horários de Funcionamento/);

  for (const pageSource of [slasPageSource, calendariosSlaPageSource]) {
    assert.match(pageSource, /requirePerfilAutenticado/);
    assert.match(pageSource, /podeGerenciarCatalogosChamado/);
    assert.match(pageSource, /notFound\(\)/);
  }

  assert.match(slasClientSource, /CatalogoPaginacao/);
  assert.match(slasClientSource, /duplicarSla/);
  assert.match(slasClientSource, /alterarStatusSla/);
  assert.doesNotMatch(slasClientSource, /delete/i);
  assert.match(calendariosSlaClientSource, /AgendaSemanalAtendimento/);
  assert.match(calendariosSlaClientSource, /Novo horário/);
  assert.match(calendariosSlaClientSource, /Total: \{calendarios\.length\}/);
  assert.match(calendariosSlaClientSource, /Salvar horário[\s\S]*<\/button>[\s\S]*<\/div>[\s\S]*<\/section>/);
  assert.match(slasActionsSource, /requirePerfilAutenticado/);
  assert.match(slasActionsSource, /podeGerenciarCatalogosChamado/);
  assert.match(slasActionsSource, /revalidatePath\(SLAS_PATH\)/);
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
  assert.match(versionSource, /PARCEIROS_PAGE_VERSION = "v1\.1\.46"/);
  assert.match(versionSource, /CONTRATOS_PAGE_VERSION = "v1\.0\.8"/);
  assert.match(versionBadgeSource, /\/cadastros\/parceiros/);
  assert.match(versionBadgeSource, /\/cadastros\/contratos/);
  assert.match(navigationSource, /id: "gerencia-contratos"/);
  assert.match(navigationSource, /href: "\/cadastros\/contratos"/);
  assert.match(parceirosFormSource, /CATEGORIAS_FINANCEIRAS/);
  assert.match(parceirosFormSource, /CampoMoedaReais/);
  assert.match(parceirosFormSource, /style:\s*"currency"[\s\S]*currency:\s*"BRL"/);
  assert.match(parceirosFormSource, /CampoSelectEditavel[\s\S]*name="categoria_financeira"/);
  assert.match(parceirosFormSource, /Compra de insumos e matéria prima/);
  assert.match(parceirosFormSource, /Despesas adicionais em operações financeiras/);
  assert.doesNotMatch(parceirosFormSource, /name="centro_custo"/);
  assert.doesNotMatch(parceirosFormSource, /name="dia_faturamento"/);
  assert.doesNotMatch(parceirosFormSource, /name="retencao"/);
  assert.doesNotMatch(parceirosFormSource, /name="natureza_operacao"/);
  assert.match(parceirosActionsSource, /categoriaFinanceiraOuNull/);
  assert.doesNotMatch(parceirosActionsSource, /centro_custo: textoOuNull\(formData\.get\("centro_custo"\)\)/);
  assert.doesNotMatch(parceirosActionsSource, /dia_faturamento: inteiroOuNull\(formData\.get\("dia_faturamento"\)\)/);
  assert.doesNotMatch(parceirosActionsSource, /retencao: textoOuNull\(formData\.get\("retencao"\)\)/);
  assert.doesNotMatch(parceirosActionsSource, /natureza_operacao: textoOuNull\(formData\.get\("natureza_operacao"\)\)/);
  assert.match(parceirosFormSource, /label: "Contratos"/);
  assert.doesNotMatch(parceirosFormSource, /label: "Contratos e SLA"/);
  assert.match(parceirosFormSource, /Gerenciar contratos/);
  assert.match(parceirosFormSource, /\/cadastros\/contratos\?parceiro=/);
  assert.doesNotMatch(parceirosFormSource, /action=\{salvarParceiroContrato\}/);
  assert.doesNotMatch(parceirosFormSource, /salvarParceiroContrato/);
  assert.doesNotMatch(parceirosFormSource, /\+ Novo contrato/);
  assert.match(contratosPageSource, /\.from\("parceiros_contratos"\)/);
  assert.match(contratosPageSource, /\.from\("parceiros"\)/);
  assert.match(contratosNovoPageSource, /Novo contrato/);
  assert.match(contratosNovoPageSource, /ContratoForm/);
  assert.match(contratosNovoPageSource, /contrato=\{null\}/);
  assert.match(contratosEditarPageSource, /Editar contrato/);
  assert.match(contratosEditarPageSource, /params: Promise<\{ id: string \}>/);
  assert.match(contratosEditarPageSource, /\.eq\("id", id\)/);
  assert.match(contratosEditarPageSource, /ContratoForm/);
  assert.match(contratosClientSource, /ContratoForm/);
  assert.match(contratosClientSource, /ContratosClient/);
  assert.match(contratosClientSource, /href=\{`\/cadastros\/contratos\/\$\{contrato\.id\}`\}/);
  assert.match(contratosClientSource, /\/cadastros\/contratos\/novo/);
  assert.doesNotMatch(contratosClientSource, /setFormAberto/);
  assert.doesNotMatch(contratosClientSource, /onClick=\{\(\) => editarContrato/);
  assert.match(contratosClientSource, /ConsultaParceiro/);
  assert.match(contratosClientSource, /type="search"/);
  assert.match(contratosClientSource, /Pesquisar por nome ou código/);
  assert.match(contratosClientSource, /deveMostrarOpcoes = aberto && !selecionadoId && busca\.trim\(\)\.length > 0/);
  assert.match(contratosClientSource, /absolute left-0 right-0 top-\[calc\(100%\+4px\)\] z-30/);
  assert.match(contratosClientSource, /excludeIds/);
  assert.match(contratosClientSource, /idsExcluidos\.has\(parceiro\.id\)/);
  assert.match(contratosClientSource, /onSelectedChange/);
  assert.doesNotMatch(contratosClientSource, /Selecionado:/);
  assert.match(contratosClientSource, /Cliente de cobrança/);
  assert.match(contratosClientSource, /setCobrarOutroContato/);
  assert.match(contratosClientSource, /Início do contrato/);
  assert.match(contratosClientSource, /Término do contrato/);
  assert.match(contratosClientSource, /Renovação automática/);
  assert.match(contratosClientSource, /calcularValorTotalPrevisto/);
  assert.match(contratosClientSource, /calcularParcelasPrevistas/);
  assert.match(contratosClientSource, /CatalogoPaginacao/);
  assert.match(contratosClientSource, /Abrir cliente/);
  assert.match(contratosClientSource, /Novo contrato/);
  assert.match(contratosClientSource, /Descrição do contrato/);
  assert.match(contratosClientSource, /Valor total previsto/);
  assert.doesNotMatch(contratosClientSource, /Previsto:/);
  assert.doesNotMatch(contratosClientSource, /name="data_base"/);
  assert.doesNotMatch(contratosClientSource, /label="Data base"/);
  assert.match(contratosClientSource, /Gerar nota fiscal/);
  assert.match(contratosClientSource, /name="sla_id" label="SLA cadastrado"/);
  assert.match(contratosClientSource, /SLA legado \/ observação/);
  assert.match(contratosActionsSource, /sla_id: uuidOuNull\(formData\.get\("sla_id"\)\)/);
  assert.match(contratosPageSource, /\.from\("slas"\)/);
  assert.match(contratosNovoPageSource, /slas=\{slas\}/);
  assert.match(contratosEditarPageSource, /slas=\{slas\}/);
  assert.match(contratosClientSource, /Dia/);
  assert.match(contratosClientSource, /Periodicidade/);
  assert.match(contratosClientSource, /formatarMoeda/);
  assert.match(contratosClientSource, /valorTotalPrevisto/);
  assert.match(contratosActionsSource, /salvarContratoGerencia/);
  assert.match(contratosActionsSource, /\.from\("parceiros_contratos"\)/);
  assert.match(contratosActionsSource, /descricao_contrato/);
  assert.match(contratosActionsSource, /valor_total_previsto/);
  assert.doesNotMatch(contratosActionsSource, /data_base: dataOuNull\(formData\.get\("data_base"\)\)/);
  assert.match(contratosActionsSource, /gerar_nota_fiscal/);
  assert.match(contratosActionsSource, /cobranca_parceiro_id/);
  assert.match(contratosActionsSource, /cobrarOutroContato && !cobrancaParceiroId/);
  assert.match(contratosActionsSource, /renovacao_automatica/);
  assert.match(contratosActionsSource, /calcularParcelasPrevistas/);
  assert.match(contratosActionsSource, /revalidatePath\("\/cadastros\/contratos"\)/);
  for (const coluna of [
    "descricao_contrato",
    "valor",
    "data_base",
    "vencimento",
    "dia_vencimento",
    "periodicidade",
    "valor_total_previsto",
    "gerar_nota_fiscal",
    "data_contrato",
    "impressao_periodo_cobranca",
    "cobrar_outro_contato",
  ]) {
    assert.match(contratosCamposMigration, new RegExp(`add column if not exists ${coluna}`, "i"));
  }
  assert.match(contratosCobrancaMigration, /add column if not exists cobranca_parceiro_id uuid null references public\.parceiros\(id\)/i);
  assert.match(contratosCobrancaMigration, /create index if not exists parceiros_contratos_cobranca_parceiro_id_idx/i);
  assert.match(contratosRenovacaoMigration, /add column if not exists renovacao_automatica boolean not null default false/i);
  assert.doesNotMatch(contratosCamposMigration, /disable row level security|drop policy|grant .* to anon|revoke delete/i);
  assert.doesNotMatch(contratosCobrancaMigration, /disable row level security|drop policy|grant .* to anon|revoke delete/i);
  assert.doesNotMatch(contratosRenovacaoMigration, /disable row level security|drop policy|grant .* to anon|revoke delete/i);

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
  assert.match(parceirosFormSource, /Horário de funcionamento/);
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
  assert.match(versionSource, /PARCEIROS_PAGE_VERSION = "v1\.1\.46"/);
  assert.match(parceirosTypesSource, /export type ParceiroOrganizacaoResumo = \{/);
  assert.match(parceirosTypesSource, /unidades_organizacao: ParceiroOrganizacaoResumo\[\]/);
  assert.doesNotMatch(filiaisTabSource, /action=\{salvarParceiroFilial\}/);
  assert.doesNotMatch(filiaisTabSource, /\+ Nova filial/);
  assert.doesNotMatch(filiaisTabSource, /<form|<input|<select|<textarea/);
  assert.doesNotMatch(filiaisTabSource, /<th className="px-4 py-3">SLA<\/th>/);
  assert.doesNotMatch(filiaisTabSource, /filial\.sla_padrao/);
  assert.doesNotMatch(filiaisTabSource, /<th className="px-4 py-3">Loja vinculada<\/th>/);
  assert.doesNotMatch(filiaisTabSource, /<th className="px-4 py-3">Horários<\/th>/);
  assert.doesNotMatch(filiaisTabSource, /filial\.horario_atendimento/);
  assert.match(filiaisTabSource, /const unidades = parceiro\.unidades_organizacao/);
  assert.match(filiaisTabSource, /Unidades vinculadas à organização/);
  assert.match(filiaisTabSource, /Vincule uma organização[\s\S]*na aba Geral/);
  assert.match(filiaisTabSource, /Esta é a única unidade vinculada à organização\./);
  assert.match(filiaisTabSource, /UnidadeAtualBadge/);
  assert.match(filiaisTabSource, /href=\{`\/cadastros\/parceiros\/\$\{unidade\.id\}`\}/);
  assert.match(filiaisTabSource, /Abrir cadastro/);
  assert.match(filiaisTabSource, /!unidade\.ativo/);
  assert.doesNotMatch(filiaisTabSource, /Filiais cadastradas/);
  assert.doesNotMatch(filiaisTabSource, /Nenhuma filial cadastrada para este cliente/);
});

test("partner general tab keeps compact canonical large-form layout", () => {
  assert.doesNotMatch(parceirosFormSource, /min-h-\[5\.75rem\]/);
  assert.match(parceirosFormSource, /feedbackConsultaClass/);
  assert.match(parceirosFormSource, /id="parceiro-geral-form"/);
  assert.match(parceiroDetailPageSource, /form="parceiro-geral-form"[\s\S]*name="acao_pos_salvar"[\s\S]*value="novo_cliente"[\s\S]*Novo cliente/);
  assert.match(parceiroDetailPageSource, /bg-gray-200[\s\S]*text-gray-950[\s\S]*Inativar/);
  assert.match(parceiroDetailPageSource, /inativacaoBloqueada[\s\S]*disabled=\{inativacaoBloqueada\}/);
  assert.match(parceiroDetailPageSource, /Este cliente está inativo/);
  assert.match(parceiroDetailPageSource, /Inativação desabilitada[\s\S]*chamados vinculados/);
  assert.match(parceiroDetailPageSource, /\.from\("chamados"\)[\s\S]*\.eq\("parceiro_id", id\)/);
  assert.match(parceiroDetailPageSource, /\.from\("chamados"\)[\s\S]*\.in\("parceiro_filial_id", filialIds\)/);
  assert.match(parceiroDetailPageSource, /\.from\("parceiros"\)[\s\S]*\.eq\("organizacao_id", parceiroBase\.organizacao_id\)/);
  assert.match(parceiroDetailPageSource, /\.from\("parceiros_filiais"\)[\s\S]*\.eq\("parceiro_id", id\)/);
  assert.match(parceiroDetailPageSource, /unidades_organizacao: unidadesOrganizacao/);
  assert.match(parceiroDetailPageSource, /a\.ativo !== b\.ativo[\s\S]*a\.ativo \? -1 : 1/);
  assert.doesNotMatch(parceiroDetailPageSource, /parceirosMesmoNucleoIds/);
  assert.match(parceirosActionsSource, /formData\.get\("acao_pos_salvar"\)/);
  assert.match(parceirosActionsSource, /acaoPosSalvar === "novo_cliente"[\s\S]*redirectComSucesso\(`\$\{LISTAGEM_PARCEIROS_PATH\}\/nova`, "novo_cliente"\)/);
  assert.match(parceirosActionsSource, /contarChamadosRelacionadosAoParceiro/);
  assert.match(parceirosActionsSource, /Este cliente possui chamados vinculados e não pode ser inativado nesta etapa\./);
  assert.match(parceiroNovaPageSource, /salvo === "novo_cliente"[\s\S]*Cadastro anterior salvo\. Preencha os dados do novo cliente\./);
  assert.match(parceirosFormSource, /canonicalFormGrid/);
  assert.match(parceirosFormSource, /auxiliaryLinkClass/);
  assert.match(parceirosFormSource, /InlineFieldCheckbox/);
  assert.match(parceirosFormSource, /inlineCheckboxClass/);
  assert.match(parceirosFormSource, /items-center justify-start gap-2/);
  assert.match(parceirosFormSource, /longTextFieldClass = "md:col-span-full"/);
  assert.match(parceirosFormSource, /const emailPattern/);
  assert.match(parceirosFormSource, /htmlFor="cnpj_cpf"[\s\S]*Consultar CNPJ[\s\S]*id="cnpj_cpf"/);
  assert.match(parceirosFormSource, /font-\[Arial\] text-\[11px\] font-semibold uppercase leading-\[inherit\]/);
  assert.match(parceirosFormSource, /whitespace-nowrap/);
  assert.match(parceirosFormSource, /gridClassName=\{dadosCadastraisGrid\}/);
  assert.match(parceirosFormSource, /grid gap-2 sm:grid-cols-2[\s\S]*Tipo de pessoa[\s\S]*Perfil operacional/);
  assert.match(parceirosFormSource, /grid gap-2 sm:grid-cols-2[\s\S]*Código interno[\s\S]*Inscrição estadual/);
  assert.match(parceirosFormSource, /grid gap-2 sm:grid-cols-2[\s\S]*Inscrição municipal[\s\S]*CRT/);
  assert.match(parceirosFormSource, /grid gap-2 sm:grid-cols-2[\s\S]*Situação[\s\S]*Segmento/);
  assert.match(parceirosFormSource, /grid gap-2 sm:grid-cols-2[\s\S]*Data de relacionamento[\s\S]*Suframa/);
  assert.match(parceirosFormSource, /flex h-\[17px\] items-end justify-between gap-3/);
  assert.doesNotMatch(parceirosFormSource, /absolute left-0 top-full inline-flex w-fit text-blue-700/);
  assert.match(
    parceirosFormSource,
    /grid min-w-0 grid-cols-\[minmax\(0,1fr\)\] gap-x-4 gap-y-\[1\.2rem\] md:grid-cols-2/
  );
  assert.doesNotMatch(parceirosFormSource, /sm:w-40/);
  assert.doesNotMatch(parceirosFormSource, /disabled=\{!cnpjConsultavel \|\| consultandoCnpj\}/);
  assert.match(parceirosFormSource, /name="cep"[\s\S]*label="CEP"[\s\S]*Buscar CEP/);
  assert.match(parceirosFormSource, /smallFieldsGroupClass/);
  assert.match(parceirosFormSource, /grid min-w-0 grid-cols-\[minmax\(0,1fr\)\] gap-2 sm:grid-cols-3/);
  assert.match(parceirosFormSource, /smallFieldsGroupClass[\s\S]*name="numero"[\s\S]*Estado \/ UF[\s\S]*País/);
  assert.match(parceirosFormSource, /role=\{feedbackClass\.includes\("red"\) \? "alert" : "status"\}/);
  assert.match(parceirosFormSource, /CampoSelectEditavel/);
  assert.match(parceirosFormSource, /label="Telefone comercial"/);
  assert.doesNotMatch(parceirosFormSource, /label="Telefone internacional"/);
  assert.match(parceirosFormSource, /label="Celular comercial"/);
  assert.doesNotMatch(parceirosFormSource, /label="Celular internacional"/);
  assert.match(parceirosFormSource, /name="contato_celular"[\s\S]*name="contato_celular_whatsapp"/);
  assert.match(parceirosFormSource, /name="responsavel_local_telefone"[\s\S]*name="responsavel_local_whatsapp"/);
  assert.match(parceirosFormSource, /label=\{densidade === "compacto" \? "Tel resp local" : "Telefone do responsável no local"\}/);
  assert.match(parceirosFormSource, /label=\{densidade === "compacto" \? "WhatsApp\?" : "Celular é WhatsApp"\}/);
  assert.match(parceirosFormSource, /longTextFieldClass[\s\S]*name="contato_observacoes"[\s\S]*Observações do contato/);
  assert.match(parceirosFormSource, /longTextFieldClass[\s\S]*name="observacoes_acesso"[\s\S]*Observações de acesso/);
  assert.match(parceirosFormSource, /longTextFieldClass[\s\S]*name="observacoes_operacionais"[\s\S]*Observações operacionais/);
  assert.match(parceirosFormSource, /longTextFieldClass[\s\S]*Documento necessário para entrada/);
  assert.match(parceirosFormSource, /flex min-h-10 items-center gap-2[\s\S]*name="documentos_entrada"/);
  assert.match(parceirosFormSource, /name="contato_email"[\s\S]*pattern=\{emailPattern\}/);
  assert.match(parceirosFormSource, /name="email"[\s\S]*pattern=\{emailPattern\}/);
  assert.match(parceirosFormSource, /Criar organização ao salvar/);
  assert.match(
    parceirosFormSource,
    /<InlineFieldCheckbox[\s\S]*name="criar_organizacao_vinculada"[\s\S]*label="Criar organização ao salvar"/
  );
  assert.match(parceirosFormSource, /inline-flex h-\[17px\] max-h-\[17px\][\s\S]*uppercase leading-\[17px\]/);
  assert.match(parceirosFormSource, /inlineCheckboxInputClass[\s\S]*h-\[17px\] w-\[17px\]/);
  assert.match(parceirosFormSource, /flex items-end justify-between gap-3[\s\S]*Organização vinculada/);
  assert.doesNotMatch(parceirosFormSource, /criarOrganizacaoVinculada/);
  assert.match(parceirosActionsSource, /valorContatoEditavel/);
  assert.match(parceirosActionsSource, /opcao === "outro"/);
  assert.doesNotMatch(parceirosFormSource, /densidade === "confortavel" \? "compacto" : densidade/);
  assert.match(parceirosFormSource, /grid gap-x-3 gap-y-2 md:grid-cols-3/);
  assert.match(
    parceirosFormSource,
    /grid min-w-0 grid-cols-\[minmax\(0,1fr\)\] gap-x-3 gap-y-4 md:grid-cols-3/
  );
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

  assert.doesNotMatch(parceirosFormSource, /AgendaSemanalAtendimento/);
  assert.doesNotMatch(parceirosFormSource, /const DIAS_ATENDIMENTO/);
  assert.match(agendaSemanalSource, /export const DIAS_ATENDIMENTO/);
  assert.match(agendaSemanalComponentSource, /export function AgendaSemanalAtendimento/);
  assert.doesNotMatch(parceirosFormSource, /horarios_atendimento_json/);
  assert.match(parceirosFormSource, /name="calendario_funcionamento_id"/);
  assert.match(parceirosFormSource, /Horário de funcionamento/);
  assert.match(parceirosFormSource, /\/configurar\/slas\/calendarios/);
  assert.match(agendaSemanalSource, /"09:00"/);
  assert.match(agendaSemanalSource, /"17:00"/);
  assert.match(agendaSemanalSource, /Não é permitido|não podem se sobrepor/);
  assert.match(parceirosActionsSource, /resolverCalendarioFuncionamento/);
  assert.match(parceirosActionsSource, /calendario_funcionamento_id/);
  assert.match(parceirosActionsSource, /\.from\("calendarios_sla"\)/);
  assert.doesNotMatch(parceirosActionsSource, /montarHorariosAtendimento/);
  assert.doesNotMatch(parceirosActionsSource, /salvarHorariosAtendimento/);
  assert.doesNotMatch(parceirosActionsSource, /\.from\("parceiro_horarios_atendimento"\)[\s\S]*\.delete\(\)/);
  assert.doesNotMatch(parceirosActionsSource, /\.from\("parceiro_horarios_atendimento"\)[\s\S]*\.insert\(/);
  assert.doesNotMatch(parceirosFormSource, /name="horario_funcionamento"/);
  assert.doesNotMatch(parceirosFormSource, /name="horario_atendimento_tecnico"/);
  assert.doesNotMatch(parceirosFormSource, /name="horario_coleta_entrega"/);
  assert.doesNotMatch(parceirosFormSource, /name="prazo_minimo_agendamento"/);
  assert.doesNotMatch(parceirosFormSource, /name="atendimento_sabado"/);
  assert.doesNotMatch(parceirosFormSource, /name="atendimento_domingo"/);
});

test("partners can select a registered default sla while preserving legacy note", () => {
  assert.match(parceirosTypesSource, /export type ParceiroSlaOpcao/);
  assert.match(parceiroDetailPageSource, /\.from\("slas"\)/);
  assert.match(parceiroDetailPageSource, /sla_padrao_id/);
  assert.match(parceiroDetailPageSource, /slas=\{slas\}/);
  assert.match(parceirosFormSource, /name="sla_padrao_id"/);
  assert.match(parceirosFormSource, /SLA padrão cadastrado/);
  assert.match(parceirosFormSource, /SLA legado \/ observação/);
  assert.match(
    parceirosActionsSource,
    /sla_padrao_id: uuidOuNull\(formData\.get\("sla_padrao_id"\)\)/
  );
});

test("working hours are shared by partners and SLA without a duplicate attendance calendar menu", () => {
  assert.match(calendariosAtendimentoMigration, /create table if not exists public\.calendarios_atendimento/i);
  assert.match(calendariosAtendimentoMigration, /add column if not exists calendario_atendimento_id uuid/i);
  assert.match(horariosFuncionamentoParceirosMigration, /add column if not exists calendario_funcionamento_id uuid null/i);
  assert.match(
    horariosFuncionamentoParceirosMigration,
    /references public\.calendarios_sla\(id\) on delete set null/i
  );
  assert.match(horariosFuncionamentoParceirosMigration, /parceiros_calendario_funcionamento_id_idx/i);

  assert.match(calendariosSlaClientSource, /Horários de Funcionamento/);
  assert.match(calendariosSlaClientSource, /parceiros e SLAs/);
  assert.match(calendariosSlaClientSource, /AgendaSemanalAtendimento/);
  assert.match(calendariosSlaClientSource, /serializarAgendaAtendimento/);
  assert.match(calendariosSlaClientSource, /validarAgendaAtendimento/);
  assert.doesNotMatch(calendariosSlaClientSource, /Calendários de SLA/);

  assert.match(parceirosTypesSource, /export type ParceiroCalendarioFuncionamentoOpcao/);
  assert.match(parceiroNovaPageSource, /createSupabaseServerClient/);
  assert.match(parceiroNovaPageSource, /supabaseUsuario[\s\S]*\.from\("calendarios_sla"\)/);
  assert.match(parceiroNovaPageSource, /supabaseUsuario[\s\S]*\.from\("calendarios_sla_horarios"\)/);
  assert.match(parceiroDetailPageSource, /createSupabaseServerClient/);
  assert.match(parceiroDetailPageSource, /supabaseUsuario[\s\S]*\.from\("calendarios_sla"\)/);
  assert.match(parceiroDetailPageSource, /calendariosFuncionamento=\{calendariosFuncionamento\}/);
  assert.match(parceirosFormSource, /calendariosFuncionamento\?: ParceiroCalendarioFuncionamentoOpcao\[\]/);
  assert.match(parceirosFormSource, /name="calendario_funcionamento_id"/);
  assert.match(parceirosFormSource, /Horário de funcionamento/);
  assert.match(parceirosFormSource, /\/configurar\/slas\/calendarios/);
  assert.match(parceirosActionsSource, /createSupabaseServerClient/);
  assert.match(
    parceirosActionsSource,
    /resolverCalendarioFuncionamento\(\s*supabaseUsuario,\s*calendarioFuncionamentoId\s*\)/
  );
  assert.match(parceirosActionsSource, /\.from\("calendarios_sla"\)/);
  assert.match(parceirosActionsSource, /calendario_funcionamento_id/);
  assert.doesNotMatch(parceirosFormSource, /calendario_sla_modelo_id/);
  assert.doesNotMatch(parceirosFormSource, /calendariosSla\?: ParceiroCalendarioSlaOpcao\[\]/);

  assert.doesNotMatch(navigationSource, /id: "gerencia-calendarios-atendimento"/);
  assert.doesNotMatch(navigationSource, /href: "\/gerencia\/calendarios-atendimento"/);
  assert.match(navigationSource, /label: "Horários de Funcionamento"/);
  assert.match(changelogSource, /v0\.9\.61/);
  assert.match(changelogSource, /Horários de Funcionamento/);
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
  assert.match(versionSource, /ORGANIZACOES_PAGE_VERSION = "v1\.1\.2"/);
  assert.match(versionSource, /NOVO_CHAMADO_PAGE_VERSION = "v0\.3\.0"/);
  assert.match(versionBadgeSource, /\/cadastros\/organizacoes/);
  assert.match(organizacaoDetalhePageSource, /\.from\("parceiros"\)/);
  assert.match(organizacaoDetalhePageSource, /\.eq\("organizacao_id", id\)/);
  assert.match(organizacaoDetalhePageSource, /parceiros_enderecos/);
  assert.match(organizacaoDetalhePageSource, /parceiros_contatos/);
  assert.match(organizacaoDetalhePageSource, /OrganizacaoFiliaisSection/);
  assert.match(organizacaoFiliaisSectionSource, /Filiais vinculadas/);
  assert.match(organizacaoFiliaisSectionSource, /Abrir cadastro/);
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
