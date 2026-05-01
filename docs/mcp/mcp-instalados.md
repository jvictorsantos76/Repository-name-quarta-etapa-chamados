# MCPs Instalados

Este inventario registra MCPs planejados, instalados, testados, aprovados, adiados, removidos ou rejeitados para o projeto `quarta-etapa-chamados`.

## Definicao dos status

- `planejado`: MCP registrado para avaliacao, mas ainda nao instalado.
- `instalado`: MCP aparece na lista de MCPs ativos do Codex.
- `testado`: MCP passou nos testes minimos definidos.
- `aprovado`: MCP passou nos testes e tem utilidade, riscos e permissoes documentados.
- `adiado`: MCP tem valor potencial, mas nao deve ser ativado agora.
- `removido`: MCP foi desativado depois de uso ou avaliacao.
- `rejeitado`: MCP nao atende aos criterios de seguranca, utilidade ou controle.

## Inventario

| Nome | Finalidade | Tipo | Comando usado | Variaveis de ambiente necessarias | Permissoes concedidas | Responsavel | Status | Data da ultima validacao | Observacoes |
|---|---|---|---|---|---|---|---|---|---|
| Context7 | Consulta de documentacao tecnica atualizada para Next.js, Supabase, React, Tailwind e bibliotecas. | stdio MCP | `npx -y @upstash/context7-mcp` | `CONTEXT7_API_KEY` | Leitura de documentacao publica | Joao Victor Dos Santos | aprovado | 2026-05-01 | Chave deve ficar fora do repositorio. Usar variavel de ambiente, sem `--api-key` literal. |
| OpenAI Docs | Consulta de documentacao oficial atualizada da OpenAI para Codex, modelos, Responses API e configuracoes. | HTTP MCP | MCP oficial `openaiDeveloperDocs` | Nenhuma | Leitura de documentacao publica oficial | Joao Victor Dos Santos | aprovado | 2026-05-01 | Usar antes de web search para temas OpenAI. |
| GitHub MCP | Consulta de repositorio, branches, commits, issues, pull requests e GitHub Actions. | A confirmar | A confirmar | `GITHUB_PERSONAL_ACCESS_TOKEN`, se necessario | Read-only inicial | A definir | planejado | A definir | Escrita somente em fase futura, com revisao previa. |
| Supabase MCP ou equivalente | Analise de schemas, tabelas, migrations, RLS, policies e erros de banco. | A confirmar | A confirmar | A confirmar | Somente leitura inicial em ambiente seguro | A definir | planejado | A definir | Risco alto. Nao aplicar migrations automaticamente. |
| Browser automation MCP ou equivalente | Validacao de telas, login, formulario de novo chamado e fluxos ponta a ponta. | A confirmar | A confirmar | A confirmar | Acesso ao localhost ou homologacao | A definir | planejado | A definir | Evitar prints/logs com dados sensiveis. |
| Google Drive ou documentacao interna | Consulta de documentos funcionais, regras de negocio e referencias operacionais. | A confirmar | A confirmar | A confirmar | Acesso minimo aos documentos necessarios | A definir | adiado | A definir | Ativar apenas quando houver necessidade clara. |
| Figma MCP ou equivalente | Apoio futuro para UI/UX e consulta a telas de referencia. | A confirmar | A confirmar | A confirmar | Acesso minimo aos arquivos necessarios | A definir | adiado | A definir | Aguardar estabilizacao do fluxo principal de chamados. |

## Regras de manutencao

- Atualizar este arquivo sempre que um MCP for instalado, testado, aprovado, adiado, removido ou rejeitado.
- Registrar apenas nomes de variaveis de ambiente, nunca valores reais.
- Revisar cada MCP a cada 30 dias.
- Revisar imediatamente antes de liberar qualquer permissao de escrita.
- Rebaixar para `adiado`, `removido` ou `rejeitado` quando utilidade, seguranca ou estabilidade nao forem comprovadas.

## Exemplo de variavel local

```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN="valor_definido_fora_do_repositorio"
```

O exemplo acima e apenas ilustrativo. Nao registrar valores reais no repositorio.
