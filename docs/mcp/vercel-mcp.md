\# MCP Vercel



\## Objetivo



Conectar o Codex ao MCP oficial da Vercel para consultar documentação, analisar deployments, revisar logs e apoiar decisões de publicação do projeto quarta-etapa-chamados.



\## Endpoint oficial



https://mcp.vercel.com



\## Escopo de uso



\- Consultar documentação oficial da Vercel.

\- Verificar projetos e deployments.

\- Analisar logs de build/deploy.

\- Apoiar troubleshooting de publicação.

\- Validar configurações de Next.js na Vercel.



\## Instalação no Codex



```powershell

codex mcp add vercel --url https://mcp.vercel.com

## Observação operacional

Durante a validação, a consulta pelo `accountId` retornou `403 Forbidden`.
A operação funcionou corretamente utilizando o slug da conta `jvictorsantos76`.

Decisão:
- Usar preferencialmente o slug da conta nas consultas via MCP Vercel.
- Tratar o erro por `accountId` como limitação de permissão/escopo, não como falha de instalação.

