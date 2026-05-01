@'
# MCP Vercel

## Papel no projeto

O MCP Vercel é a integração operacional principal entre o Codex CLI e a plataforma Vercel no projeto `quarta-etapa-chamados`.

Ele deve ser usado para consultas estruturadas relacionadas a:

- projetos Vercel;
- deployments;
- status de builds;
- logs de deployment;
- commit associado ao deployment;
- domínio vinculado ao projeto;
- validação entre branch, commit e ambiente publicado.

## Endpoint oficial

```text
https://mcp.vercel.com