# Mudancas Online Seguras

Este documento define o procedimento padrao para realizar ajustes online no
projeto `quarta-etapa-chamados` sem prejudicar o ambiente de producao.

Use este roteiro para mudancas em codigo, UI, banco, Supabase, Vercel,
configuracoes, autenticacao, RLS ou fluxos operacionais. O objetivo e permitir
evolucao continua com validacao objetiva, deploy controlado e reversibilidade.

## Principios

- Fazer uma mudanca pequena, rastreavel e reversivel por vez.
- Nunca alterar producao diretamente quando houver alternativa por branch,
  preview, migration ou configuracao versionada.
- Separar diagnostico, implementacao, validacao, publicacao e rollback.
- Tratar `npm run build` como trava obrigatoria antes de push, merge ou deploy
  de mudancas TypeScript que cruzem formularios, server actions, tipos
  compartilhados, Supabase ou fluxos operacionais.
- Usar preview da Vercel antes de promover mudancas para producao.
- Preservar `public.perfis` como fonte operacional de autorizacao.
- Preservar RLS; nao desabilitar policies para corrigir falhas.
- Nao expor secrets, tokens, dados pessoais, dados de clientes ou dados de
  chamados em logs, commits, documentos ou respostas.

## Fluxo Padrao

1. Criar ou confirmar uma branch dedicada para a mudanca.
2. Verificar estado local com `git status`.
3. Identificar arquivos, rotas, actions, tipos, tabelas, policies e migrations
   afetadas.
4. Implementar o menor ajuste suficiente para o objetivo aprovado.
5. Criar migration nova para qualquer alteracao estrutural de banco.
6. Validar localmente com os comandos aplicaveis.
7. Publicar preview e testar o fluxo afetado fora de producao.
8. Fazer merge ou deploy somente depois da validacao local e do preview.
9. Conferir producao logo apos o deploy.
10. Manter um plano de rollback pronto ate a mudanca estabilizar.

## Checklist Antes de Alterar

- [ ] O objetivo da mudanca esta claro e limitado.
- [ ] O worktree foi verificado com `git status`.
- [ ] Arquivos e fluxos afetados foram lidos antes da edicao.
- [ ] Foi confirmado se a mudanca toca banco, RLS, Storage ou autenticacao.
- [ ] Foi confirmado se a mudanca toca dados pessoais ou dados operacionais.
- [ ] Foi definido como reverter a mudanca antes de implementa-la.
- [ ] Foi definido como validar a mudanca em localhost e preview.

## Mudancas de Banco e Supabase

Mudancas de banco exigem cautela adicional porque podem afetar producao antes
do codigo novo estar publicado.

Regras obrigatorias:

- Criar sempre uma migration nova em `supabase/migrations`.
- Nao editar migrations antigas que podem ja ter sido aplicadas.
- Conferir o schema remoto antes de depender de uma tabela, coluna, function,
  grant, policy ou Storage policy.
- Preferir mudancas compativeis com a versao atual do codigo.
- Separar mudancas destrutivas em uma segunda etapa, depois de confirmada a
  estabilidade.
- Preservar diferenca entre `anon`, `authenticated` e service role.
- Nao conceder acesso publico amplo.
- Nao habilitar delete em tabelas sensiveis sem pedido explicito.

Padrao recomendado para alteracoes com risco:

1. Adicionar coluna nullable, tabela nova, indice ou policy complementar.
2. Publicar codigo que use o novo recurso com fallback seguro.
3. Validar producao.
4. Remover fallback ou estrutura antiga somente em nova mudanca planejada.

## Mudancas em Autenticacao e RLS

Para ajustes em login, perfis, papeis, permissoes e telas administrativas:

- Autenticacao bem-sucedida nao deve liberar acesso operacional sozinha.
- Usuarios sem perfil ativo em `public.perfis` devem continuar como aguardando
  aprovacao.
- Cadastro publico deve criar solicitacao pendente, salvo decisao explicita em
  contrario.
- Telas administrativas devem exigir usuario autenticado e perfil autorizado.
- Falhas de permissao devem ser investigadas em RLS, policies, grants, lookup
  de perfil ativo e roteamento antes de alterar credenciais ou liberar acesso.

## Mudancas em UI e Fluxos Operacionais

Para telas de chamados, evidencias, administracao ou atendimento:

- Validar o fluxo no localhost.
- Validar o preview da Vercel antes de producao.
- Usar mensagens claras para usuario nao tecnico.
- Evitar misturar correcao funcional com redesenho amplo.
- Atualizar changelog ou versionamento visivel quando o padrao do projeto
  exigir.

## Validacao

Para mudancas de codigo, executar:

```powershell
npm run lint
npm run build
```

Quando houver testes relevantes:

```powershell
npm test
```

Para verificacao de whitespace e arquivos versionados:

```powershell
git diff --check
```

Para UI, auth ou fluxo operacional:

```powershell
npm run dev
```

Antes de iniciar `npm run dev`, verificar se a porta `3000` ja esta em uso.

## Deploy Seguro

Antes de promover para producao:

- Confirmar que a branch contem apenas a mudanca planejada.
- Confirmar que `npm run lint` e `npm run build` passaram quando aplicavel.
- Confirmar que o preview da Vercel esta funcional.
- Confirmar que migrations necessarias foram planejadas e aplicadas na ordem
  correta.
- Confirmar que existe rollback concreto para codigo, banco, configuracao e
  deploy.

Depois do deploy:

- Conferir status do deployment.
- Testar o caminho principal afetado em producao.
- Monitorar logs de erro.
- Registrar pendencias ou riscos residuais.

## Reversibilidade e Rollback

Toda mudanca online deve ter rollback antes do deploy.

### Codigo

- Reverter o commit da mudanca ou abrir PR corretivo.
- Reimplantar o ultimo commit estavel quando necessario.
- Evitar misturar mudancas independentes no mesmo commit para facilitar
  reversao.

### Banco

- Se a migration ainda nao foi aplicada em ambiente compartilhado, ela pode ser
  ajustada antes da publicacao.
- Se a migration ja foi aplicada, criar uma nova migration corretiva.
- Evitar rollback destrutivo quando houver dados novos gravados.
- Para mudancas de schema, preferir expandir primeiro e contrair depois:
  adicionar estrutura nova, migrar uso, validar, e so entao remover estrutura
  antiga em etapa separada.

### Configuracao

- Registrar quais variaveis ou configuracoes foram alteradas, sem expor valores
  sensiveis.
- Restaurar a configuracao anterior se o comportamento produtivo degradar.
- Separar configuracao local, preview e producao.

### Deploy

- Manter referencia do ultimo deployment estavel.
- Validar status `READY` do novo deployment antes de encerrar a mudanca.
- Em falha, usar rollback/redeploy do deployment anterior estavel ou reverter o
  commit que gerou o deploy.

## Criterios de Aceite

Uma mudanca online so deve ser considerada concluida quando:

- O escopo implementado corresponde ao pedido aprovado.
- As validacoes aplicaveis foram executadas e documentadas.
- O preview foi testado quando a mudanca afetar UI, auth ou fluxo operacional.
- A producao foi conferida apos deploy, quando houver publicacao.
- O rollback esta documentado e continua executavel.
- Riscos e pendencias foram comunicados de forma objetiva.

## Quando Nao Prosseguir

Interromper a publicacao e reavaliar quando:

- `npm run build` falhar.
- A migration exigir remocao, rename ou alteracao destrutiva sem plano de dados.
- A mudanca liberar acesso operacional sem autorizacao em `public.perfis`.
- O preview apresentar erro no fluxo principal.
- O rollback depender de apagar dados reais ou expor secrets.
- Houver alteracoes nao relacionadas no mesmo diff sem decisao explicita.
