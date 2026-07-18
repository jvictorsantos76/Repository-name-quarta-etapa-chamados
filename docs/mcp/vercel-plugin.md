# Plugin Vercel

## Papel no projeto

O Plugin Vercel e uma conexao auxiliar para uso da plataforma Vercel no contexto do Codex.

Ele nao e o padrao do projeto para operacoes Vercel. O padrao oficial e o MCP Vercel documentado em `docs/mcp/vercel-mcp.md`.

## Regra de uso

Usar o Plugin Vercel somente como apoio complementar quando:

- o MCP Vercel nao estiver disponivel na sessao;
- a tarefa exigir apenas contexto rapido e nao decisao operacional;
- a informacao obtida puder ser confirmada depois pelo MCP Vercel.

Qualquer orientacao, rotina ou diagnostico que trate o plugin como conexao principal deve ser corrigido para apontar o MCP Vercel como fonte canonica.

## Diferenca em relacao ao MCP Vercel

| Criterio | MCP Vercel | Plugin Vercel |
|---|---|---|
| Papel no projeto | Padrao oficial e operacional | Auxiliar e secundario |
| Documento canonico | `docs/mcp/vercel-mcp.md` | Este arquivo |
| Uso recomendado | Deployments, builds, logs, previews, producao e auditoria | Apoio contextual quando o MCP nao estiver disponivel |
| Fonte para decisao operacional | Sim | Nao, confirmar pelo MCP |
| Escrita/alteracao | Somente com pedido explicito | Nao usar como caminho principal de escrita |

## Projeto identificado

Durante validacoes anteriores, a conexao Vercel identificou o projeto:

```text
repository-name-quarta-etapa-chamados
```

## Correcao de conexoes via plugin

Se aparecer referencia a "conexao via plugin" como caminho principal para Vercel, aplicar esta correcao documental:

```text
Usar o MCP Vercel como integracao principal. Plugin Vercel fica restrito a apoio complementar e deve ser confirmado pelo MCP antes de decisoes operacionais.
```

## Status

- Tipo: plugin/conector auxiliar.
- Status no projeto: complementar.
- Fonte canonica relacionada: `docs/mcp/vercel-mcp.md`.
- Ultima revisao: 2026-07-18.
