\# GitHub MCP



\## 1. Objetivo



Documentar a configuração, validação e uso do MCP do GitHub no projeto `quarta-etapa-chamados`.



O GitHub MCP permite que o Codex consulte informações do repositório, branches, issues, pull requests e outros recursos do GitHub, apoiando o ciclo de desenvolvimento do projeto.



\---



\## 2. Repositório validado



Repositório oficial do projeto:



`jvictorsantos76/Repository-name-quarta-etapa-chamados`



Branch principal:



`main`



\---



\## 3. Servidor MCP



Servidor remoto utilizado:



`https://api.githubcopilot.com/mcp/`



Configuração no Codex:



```toml

\[mcp\_servers.github]

url = "https://api.githubcopilot.com/mcp/"

bearer\_token\_env\_var = "GITHUB\_PAT\_TOKEN"

