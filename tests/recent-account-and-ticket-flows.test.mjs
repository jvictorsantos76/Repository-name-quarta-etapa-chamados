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

function extractArray(source, constantName) {
  const declarationStart = source.indexOf(`export const ${constantName}:`);
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
  assert.match(novoChamadoActionsSource, /PAPEIS_CATALOGO[\s\S]*"analista"/);
  assert.doesNotMatch(
    novoChamadoActionsSource,
    /PAPEIS_CATALOGO[\s\S]*"(?:operador|tecnico|cliente|solicitante)"/
  );
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
