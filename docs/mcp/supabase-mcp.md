\# Supabase MCP



\## Objetivo



O Supabase MCP conecta o Codex ao projeto Supabase da aplicação `quarta-etapa-chamados`, permitindo consultas controladas ao banco, migrations, logs, advisors, documentação oficial e geração de tipos TypeScript.



\## Status



\- MCP: `supabase`

\- Autenticação: OAuth

\- Estado: Habilitado

\- Escopo: restrito ao projeto via `project\_ref`

\- Modo recomendado: leitura (`read\_only=true`)



\## Validação realizada



Foram realizados os seguintes testes via MCP Supabase:



1\. Listagem de tabelas do schema `public`.

2\. Listagem de migrations aplicadas.

3\. Consulta aos advisors de segurança e performance.

4\. Geração dos tipos TypeScript do banco.



\## Resultado da validação



O MCP Supabase foi validado com sucesso.



Tabelas identificadas no schema `public`:



\- `perfis`

\- `clientes`

\- `lojas`

\- `chamados`

\- `registros\_tecnicos`

\- `evidencias\_anexos`

\- `historico\_status`



Migrations aplicadas identificadas:



\- `202604270001\_add\_analista\_to\_papel\_usuario`

\- `202604270002\_seed\_perfis\_jardel\_fabiana`

\- `202604270003\_status\_categoria\_ativos\_evidencias`

\- `202604270004\_fix\_status\_chamado\_enum\_to\_text`

\- `202604270005\_fix\_evidencias\_anexos\_permissions`

\- `202604270006\_auth\_rls\_operational\_flow`



\## Usos permitidos



\- Consultar estrutura do banco.

\- Listar tabelas, colunas, constraints e policies.

\- Consultar migrations aplicadas.

\- Verificar logs e advisors.

\- Gerar tipos TypeScript.

\- Consultar documentação oficial do Supabase.

\- Apoiar diagnóstico antes de criar migrations.



\## Regras de uso



\- Usar preferencialmente em modo somente leitura.

\- Não executar alterações destrutivas diretamente pelo MCP.

\- Não alterar schema sem migration versionada.

\- Não expor tokens, chaves, secrets ou credenciais.

\- Antes de criar migration, consultar o estado atual do banco.

\- Após qualquer alteração relacionada ao banco, validar com:



```powershell

npm run lint

npm run build

npx supabase db push

