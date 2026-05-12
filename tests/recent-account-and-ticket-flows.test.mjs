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
    /"(?:gestor|operador|tecnico|cliente|solicitante)"/
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
      new RegExp(`create table if not exists public\\.${tableName}`, "i")
    );
    assert.match(
      chamadoIdentificacaoMigration,
      new RegExp(`alter table public\\.${tableName} enable row level security`, "i")
    );
  }

  assert.doesNotMatch(chamadoIdentificacaoMigration, /for delete/i);
});

test("inline ticket catalog writes are restricted to admin gestor and analyst roles", () => {
  assert.match(
    chamadoIdentificacaoMigration,
    /papel(?:::text)?\s+in\s+\('super_admin', 'admin', 'gestor', 'analista'\)/i
  );
  assert.match(
    chamadoIdentificacaoMigration,
    /with check \(public\.usuario_catalogo_chamados_ativo\(\) and criado_por = auth\.uid\(\)\)/i
  );
  assert.match(novoChamadoActionsSource, /await requirePerfilAutenticado\(\)/);
  const papeisCatalogo = extractArray(novoChamadoActionsSource, "PAPEIS_CATALOGO");
  assert.match(papeisCatalogo, /"analista"/);
  assert.doesNotMatch(novoChamadoActionsSource, /perfilAtual\.papel === "solicitante"/);
});

test("new ticket form requires manual title and keeps status and number read only", () => {
  assert.match(novoChamadoFormSource, /Título \/ Assunto/);
  assert.match(novoChamadoFormSource, /Informe o Título \/ Assunto do chamado\./);
  assert.match(novoChamadoFormSource, /value="Gerado após salvar"/);
  assert.match(novoChamadoFormSource, /value="Pendente de agendamento"/);
  assert.match(novoChamadoFormSource, /Base de conhecimento relacionada/);
  assert.match(novoChamadoFormSource, /criarChamadoIdentificacao/);
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

test("login keeps invalid credential protection but warns pending users about admin approval or manual link", () => {
  assert.match(loginPageSource, /Acesso ainda não liberado\./);
  assert.match(
    loginPageSource,
    /aguarde a aprovação administrativa ou use o link enviado pela equipe responsável/
  );
});

test("awaiting approval page keeps logout path and only redirects operational users", () => {
  assert.match(aguardandoAprovacaoSource, /resolverAcessoAutenticado/);
  assert.match(aguardandoAprovacaoSource, /acesso\.message/);
  assert.match(aguardandoAprovacaoSource, /AguardandoAprovacaoClient/);
  assert.match(aguardandoAprovacaoClientSource, /syncSupabaseSessionCookies\(session\)/);
  assert.match(aguardandoAprovacaoClientSource, /fetch\("\/auth\/access-status"/);
  assert.match(aguardandoAprovacaoClientSource, /router\.replace\(acesso\.redirectTo\)/);
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
