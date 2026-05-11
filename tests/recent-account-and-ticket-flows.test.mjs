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
const aguardandoAprovacaoSource = await readFile(
  new URL("../src/app/aguardando-aprovacao/page.tsx", import.meta.url),
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
  assert.match(
    statusFormSource,
    /Chamados faturados só poderão ser alterados por analista ou admin\./
  );
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

test("ticket identification block creates catalog tables with RLS and no physical delete policy", () => {
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

  assert.match(chamadoIdentificacaoMigration, /tipo_chamado_id uuid null references public\.chamado_tipos\(id\)/i);
  assert.match(chamadoIdentificacaoMigration, /origem_id uuid null references public\.chamado_origens\(id\)/i);
  assert.match(chamadoIdentificacaoMigration, /id_externo text null/i);
  assert.match(chamadoIdentificacaoMigration, /organizacao_id uuid null references public\.clientes\(id\)/i);
  assert.match(chamadoIdentificacaoMigration, /grupo_atendimento_id uuid null references public\.grupos_atendimento\(id\)/i);
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
  assert.doesNotMatch(papeisCatalogo, /"(?:operador|tecnico|cliente|solicitante)"/);
});

test("new ticket form requires manual title and keeps status and number read only", () => {
  assert.match(novoChamadoFormSource, /Título \/ Assunto/);
  assert.match(novoChamadoFormSource, /Informe o Título \/ Assunto do chamado\./);
  assert.match(novoChamadoFormSource, /value="Gerado após salvar"/);
  assert.match(novoChamadoFormSource, /value="Pendente de agendamento"/);
  assert.match(novoChamadoFormSource, /Base de conhecimento relacionada/);
  assert.match(novoChamadoFormSource, /criarChamadoIdentificacao/);
});

test("access request provisioning uses invite and recovery links instead of magic links", () => {
  assert.match(adminUsuariosSource, /inviteUserByEmail/);
  assert.match(adminUsuariosSource, /resetPasswordForEmail/);
  assert.match(adminUsuariosSource, /gerarLinkConviteManual/);
  assert.match(adminUsuariosSource, /type: "invite"/);
  assert.match(adminUsuariosSource, /gerarLinkRecuperacaoManual/);
  assert.match(adminUsuariosSource, /type: "recovery"/);
  assert.doesNotMatch(adminUsuariosSource, /magiclink/);
});

test("pending access migration adds email confirmation expiration and audit states", () => {
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

  assert.match(pendingAccessMigration, /calcular_expiracao_horas_uteis/i);
  assert.match(pendingAccessMigration, /extract\(isodow from cursor_hora\) between 1 and 5/i);
});

test("RLS removes broad development policies and restricts pending ticket access", () => {
  for (const policy of [
    "dev_select_chamados",
    "dev_insert_chamados",
    "dev_update_chamados",
    "dev_select_clientes",
    "dev_select_lojas",
    "dev_select_historico_status",
    "dev_insert_historico_status",
    "dev_select_registros_tecnicos",
    "dev_insert_registros_tecnicos",
  ]) {
    assert.match(pendingAccessMigration, new RegExp(`drop policy if exists ${policy}`, "i"));
  }

  assert.match(pendingAccessMigration, /usuario_solicitacao_pendente_ativa/i);
  assert.match(pendingAccessMigration, /usuario_acesso_chamados_ativo/i);
  assert.match(pendingAccessMigration, /operador_id = auth\.uid\(\)/i);
  assert.match(pendingAccessMigration, /s\.cliente_id = chamados\.cliente_id/i);
  assert.match(pendingAccessMigration, /s\.loja_id = chamados\.loja_id/i);
  assert.match(pendingAccessMigration, /registros_tecnicos_insert_operacionais/i);
  assert.doesNotMatch(pendingAccessMigration, /to anon, authenticated[\s\S]*with check \(true\)/i);
});

test("server guards expire or block pending rejected users before granting access", () => {
  assert.match(serverSupabaseSource, /auth\.getUser\(\s*accessToken\s*\)/);
  assert.match(serverSupabaseSource, /bloquearSolicitacaoExpirada/);
  assert.match(serverSupabaseSource, /status: "expirado"/);
  assert.match(serverSupabaseSource, /perfil\.papel === "solicitante"/);
  assert.match(serverSupabaseSource, /redirect\("\/aguardando-aprovacao"\)/);
});

test("auth confirm verifies email without leaving token hash in final redirect", () => {
  assert.match(authConfirmSource, /verifyOtp\(\{[\s\S]*token_hash: tokenHash[\s\S]*type: type as EmailOtpType/);
  assert.match(authConfirmSource, /confirmarSolicitacaoEmail\(session\)/);
  assert.match(authConfirmSource, /status: "pendente_aprovacao"/);
  assert.match(authConfirmSource, /calcular_expiracao_horas_uteis/);
  assert.match(authConfirmSource, /clearSupabaseSessionCookies/);
  assert.match(authConfirmSource, /if \(!confirmacaoOperacional\.ok\)/);
  assert.match(authConfirmSource, /redirectTo\(request, "\/chamados\/novo"\)/);
  assert.doesNotMatch(authConfirmSource, /redirectTo\(request,\s*request\.url/);
});

test("public cadastro creates Supabase signup with password and pending email confirmation", () => {
  assert.match(cadastroActionsSource, /supabase\.auth\.signUp/);
  assert.match(cadastroActionsSource, /signInWithPassword/);
  assert.match(cadastroActionsSource, /emailRedirectTo: `\$\{baseUrl\}\/auth\/confirm`/);
  assert.match(cadastroActionsSource, /supabaseAdmin[\s\S]*\.from\("solicitacoes_acesso"\)/);
  assert.match(cadastroActionsSource, /status: emailJaConfirmado[\s\S]*\? "pendente_aprovacao"/);
  assert.match(cadastroActionsSource, /: "pendente_confirmacao_email"/);
  assert.match(cadastroActionsSource, /user_id: authUserId/);
  assert.match(cadastroActionsSource, /auth\.admin\.deleteUser\(authUserId\)/);
  assert.match(cadastroActionsSource, /papel: "solicitante"/);
  assert.match(cadastroActionsSource, /senha\.length < 8/);
});

test("awaiting approval login button clears the active session first", () => {
  assert.match(aguardandoAprovacaoSource, /getSupabaseAccessToken/);
  assert.match(aguardandoAprovacaoSource, /auth\.getUser/);
  assert.match(aguardandoAprovacaoSource, /redirect\("\/chamados\/novo"\)/);
  assert.match(aguardandoAprovacaoSource, /redirect\("\/"\)/);
  assert.match(aguardandoAprovacaoSource, /href="\/auth\/logout"/);
  assert.doesNotMatch(aguardandoAprovacaoSource, /href="\/login"/);
});
