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
const cadastroActionsSource = await readFile(
  new URL("../src/app/cadastro/actions.ts", import.meta.url),
  "utf8"
);
const middlewareSource = await readFile(
  new URL("../middleware.ts", import.meta.url),
  "utf8"
);
const perfilGrantMigration = await readFile(
  new URL(
    "../supabase/migrations/202605060004_perfis_self_update_cargo.sql",
    import.meta.url
  ),
  "utf8"
);

function extractArray(source, constantName) {
  const exportedDeclarationStart = source.indexOf(`export const ${constantName}:`);
  const internalDeclarationStart = source.indexOf(`const ${constantName} =`);
  const declarationStart =
    exportedDeclarationStart === -1
      ? internalDeclarationStart
      : exportedDeclarationStart;
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

test("public registration records a pending access request without creating an operational account", () => {
  assert.match(cadastroActionsSource, /from\("solicitacoes_acesso"\)\s*\.\s*insert/);
  assert.match(cadastroActionsSource, /status:\s*"pendente_aprovacao"/);
  assert.match(cadastroActionsSource, /from\("aceites_legais"\)\s*\.\s*insert/);
  assert.match(cadastroActionsSource, /tipo_documento:\s*"termos_uso"/);
  assert.match(cadastroActionsSource, /tipo_documento:\s*"politica_privacidade"/);
  assert.match(cadastroActionsSource, /versao_documento:\s*LEGAL_DOCUMENTS_VERSION/);
  assert.doesNotMatch(cadastroActionsSource, /\.auth\.(?:signUp|admin\.createUser)/);
  assert.doesNotMatch(cadastroActionsSource, /from\("perfis"\)\s*\.\s*insert/);
});

test("middleware keeps only expected access and legal routes public", () => {
  const publicPaths = extractArray(middlewareSource, "PUBLIC_PATHS");

  for (const path of [
    "/login",
    "/auth",
    "/cadastro",
    "/aguardando-aprovacao",
    "/politica-privacidade",
    "/termos-uso",
  ]) {
    assert.match(publicPaths, new RegExp(`"${path}"`));
  }

  assert.doesNotMatch(publicPaths, /"\/(?:admin|chamados|conta|perfil)"/);
  assert.match(
    middlewareSource,
    /if \(!accessToken && !isPublicPath\) \{\s*return NextResponse\.redirect\(new URL\("\/login", request\.url\)\);/s
  );
  assert.match(
    middlewareSource,
    /const isAuthEntryPath = pathname === "\/login" \|\| pathname === "\/cadastro";/
  );
});
