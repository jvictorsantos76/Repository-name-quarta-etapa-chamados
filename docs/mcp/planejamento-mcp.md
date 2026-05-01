# Planejamento de MCPs

## Visao geral

Este documento define boas praticas para uso de servidores MCP no projeto `quarta-etapa-chamados`. O objetivo e aumentar a capacidade do Codex de consultar documentacao, repositorio, issues, banco de dados e ferramentas externas de forma controlada, segura e rastreavel.

Esta etapa e apenas documental. Nao instala MCPs, nao altera codigo da aplicacao, nao altera banco de dados, nao cria migrations, nao altera `.env.local`, nao altera producao e nao concede permissoes reais.

## Objetivos

- Comecar pelos MCPs de maior valor e menor risco.
- Priorizar Context7 e GitHub MCP em modo de consulta.
- Tratar Supabase e automacao de navegador com cautela por envolver dados, RLS, autenticacao e fluxos operacionais.
- Registrar permissoes, riscos, status, responsavel e ultima validacao de cada MCP.
- Definir criterios claros para manter, adiar, remover ou rejeitar MCPs.
- Revisar MCPs a cada 30 dias ou antes de liberar qualquer permissao de escrita.

## Inventario recomendado

| MCP | Prioridade | Risco | Utilidade | Status inicial | Uso recomendado |
|---|---|---|---|---|---|
| Context7 | Alta | Baixo | Alta | planejado | Consultar documentacao atual de Next.js, Supabase, React, Tailwind e bibliotecas. |
| GitHub MCP | Alta | Medio | Alta | planejado | Consultar repositorios, branches, commits, issues, pull requests e GitHub Actions. |
| Supabase MCP ou equivalente | Media | Alto | Alta | planejado | Inspecionar schemas, tabelas, migrations, RLS, policies e erros de banco em modo somente leitura. |
| Browser automation MCP ou equivalente | Media | Medio | Media | planejado | Validar telas, login, abertura de chamados e mensagens de erro em localhost ou homologacao. |
| Google Drive ou documentacao interna | Baixa | Medio | Media | adiado | Consultar documentos funcionais e regras de negocio com escopo minimo. |
| Figma MCP ou equivalente | Baixa | Baixo/Medio | Baixa no inicio | adiado | Apoiar UI/UX somente apos estabilizacao do fluxo principal de chamados. |

## MCPs essenciais agora

### Context7

- Prioridade: alta.
- Risco: baixo.
- Utilidade: alta.
- Padrao recomendado: consulta de documentacao publica, sem secrets e sem permissao de escrita.
- Criterio de aceite: aparecer em `/mcp`, responder consultas de Supabase Auth e Next.js App Router, e diferenciar documentacao consultada de conhecimento geral.

### GitHub MCP

- Prioridade: alta.
- Risco: medio.
- Utilidade: alta.
- Padrao recomendado: iniciar em read-only sempre que possivel.
- Variavel padronizada, quando necessaria: `GITHUB_PERSONAL_ACCESS_TOKEN`.
- Criterio de aceite: listar repositorios acessiveis, localizar `quarta-etapa-chamados`, listar branches, commits, issues, pull requests e checks sem permissao de escrita no inicio.

## MCPs uteis com cautela

### Supabase MCP ou alternativa equivalente

- Prioridade: media.
- Risco: alto.
- Utilidade: alta.
- Padrao recomendado: somente leitura, primeiro em ambiente local ou homologacao.
- Nao deve aplicar migrations automaticamente.
- Nao deve consultar dados pessoais sem necessidade operacional clara.
- Deve ser usado para analisar estrutura, RLS, policies e erros, com cuidado especial para tabelas de chamados, perfis, evidencias e historico.

### Browser automation MCP ou alternativa equivalente

- Prioridade: media.
- Risco: medio.
- Utilidade: media.
- Padrao recomendado: validar localhost antes de homologacao.
- Deve evitar prints e logs com dados sensiveis.
- Deve registrar apenas evidencias sanitizadas quando necessario.

## MCPs avaliados e não adotados no momento

### Google Drive / Docs MCP

O MCP Google Drive / Docs foi avaliado para uso como apoio documental no projeto, com foco em consulta a documentos, atas, requisitos e materiais externos ao repositório.

A integração não foi adotada neste momento porque o servidor oficial do Google Drive MCP foi reconhecido pelo Codex, mas a autenticação não foi concluída devido à incompatibilidade do fluxo OAuth disponível.

Erro identificado:

```text
Dynamic client registration not supported


## MCPs adiados

### Google Drive ou documentacao interna

Adiar ate existir necessidade clara de consultar documentos funcionais. Quando ativado, limitar acesso aos documentos necessarios ao projeto e evitar arquivos pessoais ou fora do escopo.

### Figma MCP ou equivalente

Adiar ate o fluxo principal de chamados estar mais estavel. Quando ativado, documentar quais telas ou componentes serao usados como referencia.

## Matriz de prioridade

| Prioridade | Criterio | MCPs |
|---|---|---|
| Alta | Resolve dor atual com baixo ou medio risco. | Context7, GitHub MCP |
| Media | Gera valor, mas toca dados, login, banco ou fluxos sensiveis. | Supabase MCP, Browser automation |
| Baixa | Depende de maturidade futura ou necessidade ainda nao comprovada. | Google Drive, Figma |

## Matriz de risco

| Risco | Caracteristicas | Controles obrigatorios |
|---|---|---|
| Baixo | Consulta documentacao publica, sem dados internos e sem secrets. | Registrar finalidade e validar utilidade. |
| Medio | Acessa repositorios, issues, PRs, documentos internos ou telas autenticadas. | Usar menor permissao possivel, revisar logs e validar escopo. |
| Alto | Acessa banco, RLS, policies, dados operacionais ou producao. | Somente leitura inicialmente, revisao explicita, sem operacoes destrutivas e sem aplicar migrations automaticamente. |

## Checklist de seguranca

- [ ] O MCP resolve uma dor real do projeto.
- [ ] O tipo de acesso foi definido: leitura, escrita ou administracao.
- [ ] O ambiente foi definido: local, homologacao ou producao.
- [ ] Secrets serao configurados por variaveis de ambiente, nunca no repositorio.
- [ ] Permissoes concedidas foram registradas.
- [ ] Logs nao exibem credenciais, tokens, chaves ou dados pessoais desnecessarios.
- [ ] MCP sensivel comeca em modo somente leitura quando possivel.
- [ ] Escrita em GitHub, Supabase ou producao foi classificada como risco alto.
- [ ] Revisao periodica foi agendada para ate 30 dias.

## Checklist de validacao

- [ ] O servidor aparece na lista de MCPs ativos do Codex.
- [ ] O Codex consegue consultar dados simples.
- [ ] O Codex consegue explicar quais ferramentas o MCP disponibiliza.
- [ ] O MCP nao expoe secrets no log.
- [ ] O MCP funciona apos reiniciar o Codex.
- [ ] O MCP tem utilidade clara para o projeto.
- [ ] O MCP tem permissoes compativeis com sua finalidade.
- [ ] O risco operacional esta documentado.

## Plano por fases

### Fase 0: documentacao

- Criar `docs/mcp/`.
- Criar documentos de planejamento, checklist, inventario e politica de seguranca.
- Registrar todos os MCPs como `planejado` ou `adiado`.

### Fase 1: Context7

- Confirmar se aparece em `/mcp`.
- Consultar documentacao atual de Supabase Auth.
- Consultar documentacao atual de Next.js App Router.
- Confirmar que a resposta diferencia documentacao consultada de conhecimento geral.
- Confirmar que nao exige autenticacao desnecessaria.

### Fase 2: GitHub MCP

- Confirmar se aparece em `/mcp`.
- Listar repositorios acessiveis.
- Localizar `quarta-etapa-chamados`.
- Listar branches, ultimos commits, issues abertas, pull requests e checks.
- Confirmar que o modo read-only nao permite criar ou alterar conteudo.
- Se escrita for liberada no futuro, testar primeiro em issue de teste, nunca diretamente na branch principal.

### Fase 3: Supabase MCP ou equivalente

- Confirmar conexao somente em ambiente seguro.
- Listar schemas e tabelas sem expor dados sensiveis.
- Consultar estrutura de chamados, usuarios, evidencias e historico.
- Verificar RLS e policies.
- Nao executar migrations automaticamente.
- Sugerir migrations em arquivo, mas nao aplicar sem autorizacao.

### Fase 4: Browser automation

- Abrir ambiente local.
- Validar login.
- Validar navegacao para `/chamados/novo`.
- Validar preenchimento do formulario.
- Validar mensagens de erro.
- Validar criacao de chamado apenas em ambiente local ou homologacao.
- Registrar prints/logs somente se nao contiverem dados sensiveis.

### Fase 5: documentacao interna e Figma

- Google Drive ou documentacao interna: limitar acesso aos documentos necessarios.
- Figma: usar apenas quando houver necessidade real de UI/UX.
- Documentar finalidade, permissao, responsavel e criterio de aceite.

## Criterios de aceite

- Ordem clara de implantacao dos MCPs.
- Seguranca priorizada antes de conveniencia.
- MCPs separados entre essenciais, uteis com cautela e adiados.
- Checklists aplicaveis.
- Testes minimos por MCP documentados.
- GitHub usa `GITHUB_PERSONAL_ACCESS_TOKEN`.
- Nenhum secret real documentado.
- Nenhum codigo, banco, migration, `.env.local` ou producao alterado.
- Documentacao versionavel criada dentro do repositorio.

## Criterios para manter, adiar, remover ou rejeitar

### Manter

- Resolve dor real do projeto.
- Funciona apos reiniciar o Codex.
- Tem permissoes minimas.
- Nao expoe secrets.
- Tem teste funcional documentado.
- Melhora seguranca, rastreabilidade ou velocidade de diagnostico.

### Adiar

- Depende de fluxo ainda instavel.
- Exige permissoes amplas.
- Tem utilidade incerta.
- Exige ferramenta paga ou configuracao complexa sem retorno imediato.

### Remover

- Nao e usado.
- Quebra com frequencia.
- Expoe dados demais.
- Exige permissoes maiores que sua finalidade.
- Gera logs sensiveis.
- Duplica outra ferramenta mais simples.

### Rejeitar

- Exige acesso amplo sem justificativa.
- Nao permite limitar permissao.
- Nao atende a LGPD ou aos controles minimos do projeto.
- Incentiva operacoes destrutivas ou automacoes inseguras.

## Proximos passos

1. Validar estes documentos no Git.
2. Ativar ou confirmar Context7.
3. Registrar resultado em `docs/mcp/mcp-instalados.md`.
4. Ativar GitHub MCP em read-only.
5. Revisar MCPs em ate 30 dias ou antes de qualquer permissao de escrita.
