# MCP Vercel

## Papel no projeto

Este arquivo e o padrao oficial do projeto `quarta-etapa-chamados` para conexoes com a Vercel via MCP.

O MCP Vercel e a integracao operacional principal entre o Codex e a plataforma Vercel. Ele deve ser usado antes de qualquer conexao auxiliar por plugin quando a tarefa envolver projetos, deployments, builds, logs, dominios, previews, status de producao ou validacao entre branch, commit e ambiente publicado.

## Endpoint oficial

```text
https://mcp.vercel.com
```

## Status

- Tipo: HTTP MCP oficial da Vercel.
- Status no projeto: aprovado.
- Ultima validacao: 2026-07-18.
- Projeto Vercel validado: `repository-name-quarta-etapa-chamados`.
- Project ID local: `.vercel/project.json`.
- Uso padrao: somente leitura, exceto quando houver pedido explicito para deploy ou alteracao.

## Uso recomendado

Usar o MCP Vercel para:

- listar projetos e deployments;
- consultar detalhes de deployment por ID ou URL;
- inspecionar logs de build;
- validar status `READY`, `ERROR` ou outros estados de deployment;
- cruzar deployment com branch, commit e PR;
- validar previews de PR;
- consultar dominio de producao;
- gerar acesso temporario a preview protegido quando necessario;
- buscar documentacao oficial da Vercel quando a duvida envolver a plataforma.

## Regra canonica para conexoes

O MCP Vercel e a fonte padrao do projeto para operacoes e diagnosticos relacionados a Vercel.

Conexoes via plugin ou conector auxiliar nao devem substituir este padrao. Quando uma conexao via plugin aparecer em docs, rotinas ou orientacoes do projeto, ela deve ser tratada como:

- apoio complementar;
- alternativa temporaria quando o MCP nao estiver disponivel;
- fonte secundaria que precisa ser confirmada pelo MCP Vercel antes de decisoes operacionais.

Se uma orientacao indicar o Plugin Vercel como caminho principal, corrigir a orientacao para apontar este arquivo como fonte canonica.

## Permissoes e seguranca

- Comecar em modo somente leitura sempre que possivel.
- Nao executar deploy, rollback, alteracao de dominio, variaveis de ambiente ou configuracao produtiva sem pedido explicito.
- Nao registrar tokens, secrets ou valores de variaveis de ambiente.
- Nao expor logs com dados pessoais ou operacionais desnecessarios.
- Para investigacao de producao, preferir primeiro leitura de status e logs.

## Teste minimo aprovado

Em 2026-07-18, o MCP Vercel foi validado com sucesso no projeto:

- `list_deployments` retornou deployments reais do projeto.
- `get_deployment` retornou detalhes do deployment de producao.
- `get_deployment_build_logs` retornou logs de build e permitiu identificar falha TypeScript em deploys antigos.
- `web_fetch_vercel_url` validou resposta HTTP `200` para o dominio de producao.
- `list_toolbar_threads` retornou sem threads pendentes.

## Evidencia operacional recente

O MCP Vercel identificou que os deploys antigos abaixo falharam no `buildStep` por erro TypeScript:

- `dpl_5KWZXaNZKiM4gLAmGZ9k1JDiheDA`
- `dpl_35w76JRKtPhp77LrjTXzWLvgD8Bo`
- `dpl_4RscuteXPo1N41oMfPZkWzZdPfnP`

Causa confirmada:

```text
./src/app/cadastros/parceiros/ParceiroForm.tsx:48:8
Type error: '"./types"' has no exported member named 'ParceiroCalendarioFuncionamentoOpcao'.
```

O deploy posterior `dpl_FhVxNCFSSqiTizHeXKqhFb2Gxj7n` voltou a `READY` apos a correcao do contrato de tipos em `src/app/cadastros/parceiros/types.ts`.

## Relacao com Graphify

Graphify e usado no projeto como ferramenta auxiliar de navegacao arquitetural. Ele nao substitui o MCP Vercel para diagnosticos de deployment.

Quando uma investigacao envolver impacto de codigo no deploy, a sequencia recomendada e:

1. Usar Graphify para orientar os modulos afetados, quando a mudanca cruzar muitas areas.
2. Usar Git para localizar commits e arquivos alterados.
3. Usar MCP Vercel para validar build, deployment, preview e producao.
4. Rodar `npm run lint` e `npm run build` localmente antes de push ou merge.

## Arquivos relacionados

- `docs/mcp/vercel-plugin.md`: documenta o plugin como camada auxiliar, nao canonica.
- `docs/mcp/mcp-instalados.md`: inventario de MCPs e conectores avaliados.
- `docs/mcp/politica-seguranca-mcp.md`: regras de seguranca para MCPs.
