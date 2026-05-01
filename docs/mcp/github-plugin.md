# GitHub Plugin — Codex

## 1. Objetivo

Documentar o uso do Plugin oficial do GitHub no Codex para o projeto `quarta-etapa-chamados`.

O Plugin GitHub será utilizado como integração principal para inspeção de repositório, leitura de commits, análise de pull requests, issues, checks, GitHub Actions e apoio ao fluxo de desenvolvimento.

## 2. Decisão do projeto

| Item | Decisão |
|---|---|
| Integração principal | GitHub Plugin oficial do Codex |
| MCP GitHub standalone | Não utilizado |
| Status do MCP GitHub | Removido/desativado |
| Motivo | O Plugin já cobre as necessidades atuais do projeto |

## 3. Escopo de uso

O Plugin GitHub pode ser usado para:

- inspecionar repositórios;
- consultar branch padrão;
- consultar commits;
- revisar pull requests;
- verificar issues;
- analisar checks e GitHub Actions;
- apoiar revisão de código;
- preparar mudanças para revisão;
- apoiar criação de commits e pull requests quando solicitado.

## 4. Restrições operacionais

Por padrão, o uso do Plugin GitHub deve respeitar as seguintes restrições:

- não fazer merge direto na branch `main` sem autorização explícita;
- não apagar branches sem autorização explícita;
- não alterar secrets sem autorização explícita;
- não criar releases sem solicitação direta;
- não executar ações destrutivas sem validação prévia;
- priorizar leitura e diagnóstico antes de qualquer escrita.

## 5. Comandos úteis no Codex

### Inspecionar repositório

```text
@github Inspecione o repositório quarta-etapa-chamados e informe branch padrão, últimos commits, PRs abertos, issues abertas e checks recentes.