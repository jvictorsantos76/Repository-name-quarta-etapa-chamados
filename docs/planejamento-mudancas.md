# Planejamento de Mudancas e Correcoes

Este documento centraliza o roteiro operacional de mudancas do projeto `quarta-etapa-chamados`.
Ele deve orientar prioridades, riscos, validacoes e proximos passos sem substituir issues,
commits, migrations ou validacao tecnica.

## Principios

- Fazer uma mudanca focada por vez.
- Preservar padroes existentes de Next.js, TypeScript, Supabase, RLS e UI operacional.
- Tratar `public.perfis` como fonte de verdade para acesso operacional, papeis e autorizacao.
- Criar nova migration para alteracoes de banco; nao editar migrations antigas ja aplicadas.
- Nao alterar `.env.local`, secrets, producao ou dados reais sem solicitacao explicita.
- Validar mudancas com `npm run lint` e `npm run build` quando houver alteracao de codigo.
- Para UI, seguir `DESIGN.md` e priorizar densidade operacional, clareza e rastreabilidade.

## Em Andamento

Registrar aqui mudancas que estao sendo implementadas ou validadas.

| Item | Area | Status | Responsavel | Evidencia |
|---|---|---|---|---|
| Documentar roteiro de mudancas e correcoes | Governanca do projeto | em andamento | Codex | `docs/planejamento-mudancas.md` |

## Proximas Mudancas

Registrar aqui candidatos a implementacao, sem assumir que todos estao aprovados.

| Prioridade | Item | Area | Motivo | Criterio de aceite |
|---|---|---|---|---|
| Alta | Manter changelog versionavel | Governanca | Facilitar rastreio de entregas e regressao | `CHANGELOG.md` atualizado junto com mudancas visiveis |
| Media | Formalizar decisoes tecnicas recorrentes | Arquitetura | Reduzir decisoes repetidas em auth, perfis, RLS e evidencias | Documento de decisoes com fonte de verdade e impacto |
| Media | Padronizar checklists de mudanca controlada | Qualidade | Evitar esquecimento de lint, build, migration e validacao localhost | Checklist curto em `docs/checklists/` |

## Correcoes Pendentes

Registrar bugs, inconsistencias ou debitos conhecidos antes de implementar.

| Prioridade | Correcao | Area afetada | Risco | Validacao esperada |
|---|---|---|---|---|
| A definir | A definir | A definir | A definir | A definir |

## Riscos Conhecidos

- Autenticacao e autorizacao sao camadas separadas; login bem-sucedido nao garante acesso operacional.
- Usuarios sem perfil ativo em `public.perfis` devem permanecer aguardando aprovacao.
- Fluxos de evidencias podem falhar em duas etapas distintas: upload no Storage e insercao em tabela.
- Mudancas em RLS, policies, grants e roles podem quebrar fluxos anonimos, autenticados ou service role.
- Telas administrativas pequenas devem manter persistencia real, revalidacao e autorizacao adequada.

## Decisoes Tecnicas

Registrar decisoes que afetam futuras mudancas.

| Data | Decisao | Impacto |
|---|---|---|
| 2026-07-16 | Graphify aprovado como ferramenta auxiliar de navegacao, nao como fonte unica de arquitetura | Usar relatorios Graphify para localizar modulos e dependencias, mas validar conclusoes lendo codigo e migrations |
| 2026-07-16 | `public.perfis` permanece como fonte operacional de autorizacao | Alteracoes de acesso devem consultar perfil ativo e respeitar RLS |

## Checklist Antes de Implementar

- [ ] Entender o pedido e o fluxo afetado.
- [ ] Identificar arquivos, rotas, migrations e policies relacionadas.
- [ ] Confirmar se a mudanca exige migration.
- [ ] Confirmar se ha impacto em autorizacao, RLS, dados pessoais ou LGPD.
- [ ] Verificar se ha alteracoes preexistentes no worktree.
- [ ] Planejar validacao minima antes de editar.

## Checklist Depois de Implementar

- [ ] Rodar `npm run lint` quando houver alteracao de codigo.
- [ ] Rodar `npm run build` quando houver alteracao de codigo.
- [ ] Rodar testes existentes quando o fluxo tocado tiver cobertura.
- [ ] Validar localhost quando a mudanca for visual, de auth ou fluxo operacional.
- [ ] Atualizar versao/changelog quando a mudanca afetar comportamento visivel.
- [ ] Registrar riscos, pendencias e proximo passo.

## Uso do Graphify

Usar `$graphify-arquitetura` quando a mudanca depender de navegacao arquitetural,
impacto entre modulos ou entendimento de dependencias. Nao usar Graphify como prova unica
para decisoes de banco, RLS, autorizacao ou comportamento de UI.

## Historico Resumido

| Data | Evento | Evidencia |
|---|---|---|
| 2026-07-16 | Criado documento inicial de planejamento de mudancas e correcoes | `docs/planejamento-mudancas.md` |
| 2026-07-16 | Criado changelog versionavel aderente ao changelog visivel do sistema | `CHANGELOG.md` |
