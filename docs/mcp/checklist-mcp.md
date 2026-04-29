# Checklist de MCPs

## Checklist geral antes de instalar MCP

- [ ] Existe uma dor real do projeto que o MCP resolve.
- [ ] A finalidade do MCP esta documentada.
- [ ] O ambiente de uso esta definido: local, homologacao ou producao.
- [ ] O tipo de acesso esta definido: leitura, escrita ou administracao.
- [ ] O responsavel pela configuracao e revisao foi definido.
- [ ] As variaveis de ambiente necessarias foram listadas sem valores reais.
- [ ] O MCP pode iniciar com a menor permissao possivel.
- [ ] O risco foi classificado como baixo, medio ou alto.
- [ ] Foi definida uma revisao para ate 30 dias.
- [ ] Foi definida revisao obrigatoria antes de qualquer permissao de escrita.

## Checklist de status

- [ ] `planejado`: MCP registrado para avaliacao, mas ainda nao instalado.
- [ ] `instalado`: MCP aparece na lista de MCPs ativos do Codex.
- [ ] `testado`: MCP passou nos testes minimos definidos.
- [ ] `aprovado`: MCP passou nos testes e tem utilidade, riscos e permissoes documentados.
- [ ] `adiado`: MCP tem valor potencial, mas nao deve ser ativado agora.
- [ ] `removido`: MCP foi desativado depois de uso ou avaliacao.
- [ ] `rejeitado`: MCP nao atende aos criterios de seguranca, utilidade ou controle.

## Context7

- [ ] Confirmar se aparece em `/mcp`.
- [ ] Solicitar consulta a documentacao atual de Supabase Auth.
- [ ] Solicitar consulta a documentacao atual de Next.js App Router.
- [ ] Verificar se a resposta diferencia documentacao consultada de conhecimento geral.
- [ ] Verificar se nao exige autenticacao desnecessaria.
- [ ] Registrar status, responsavel e ultima validacao.

## GitHub MCP

- [ ] Confirmar se aparece em `/mcp`.
- [ ] Listar repositorios acessiveis.
- [ ] Localizar o repositorio `quarta-etapa-chamados`.
- [ ] Listar branches.
- [ ] Listar ultimos commits.
- [ ] Listar issues abertas.
- [ ] Listar pull requests.
- [ ] Listar status de checks ou GitHub Actions, se disponivel.
- [ ] Confirmar que usa `GITHUB_PERSONAL_ACCESS_TOKEN`, se token for necessario.
- [ ] Confirmar que o acesso inicial e read-only sempre que possivel.
- [ ] Se estiver em read-only, confirmar que nao consegue criar ou alterar conteudo.
- [ ] Se escrita for liberada no futuro, testar primeiro em issue de teste.
- [ ] Registrar status, responsavel, permissoes e ultima validacao.

## Supabase MCP ou alternativa equivalente

- [ ] Confirmar conexao somente em ambiente seguro.
- [ ] Confirmar que o acesso inicial e somente leitura.
- [ ] Listar schemas/tabelas sem expor dados sensiveis.
- [ ] Consultar estrutura de tabelas relacionadas a chamados, usuarios, evidencias e historico.
- [ ] Verificar RLS e policies.
- [ ] Confirmar que nao executa migrations automaticamente.
- [ ] Confirmar que nao executa operacoes destrutivas sem autorizacao explicita.
- [ ] Sugerir migrations em arquivo quando necessario, sem aplicar automaticamente.
- [ ] Registrar status, responsavel, permissoes e ultima validacao.

## Browser automation

- [ ] Abrir ambiente local.
- [ ] Validar login.
- [ ] Validar navegacao para `/chamados/novo`.
- [ ] Validar preenchimento do formulario.
- [ ] Validar mensagens de erro.
- [ ] Validar criacao de chamado apenas em ambiente local ou homologacao.
- [ ] Confirmar que prints/logs nao contem dados sensiveis.
- [ ] Registrar status, responsavel e ultima validacao.

## Google Drive ou documentacao interna

- [ ] Confirmar acesso apenas aos documentos necessarios.
- [ ] Localizar documentacao funcional do projeto.
- [ ] Resumir regras de negocio sem alterar arquivos.
- [ ] Confirmar que nao usa documentos pessoais ou fora do escopo.
- [ ] Registrar status, responsavel, permissoes e ultima validacao.

## Figma MCP ou equivalente

- [ ] Confirmar necessidade real de UI/UX.
- [ ] Confirmar que o fluxo principal de chamados esta suficientemente estavel.
- [ ] Documentar quais telas serao usadas como referencia.
- [ ] Confirmar permissao de acesso minima.
- [ ] Registrar status, responsavel e ultima validacao.

## Checklist de revisao de permissoes

- [ ] A permissao atual ainda e necessaria.
- [ ] O MCP continua sendo usado.
- [ ] O responsavel revisou logs e escopo.
- [ ] Nao houve exposicao de secrets.
- [ ] Nao houve acesso indevido a dados sensiveis.
- [ ] Permissoes de escrita foram revisadas antes de serem liberadas.
- [ ] A revisao ocorreu em ate 30 dias desde a ultima validacao.
- [ ] O status em `mcp-instalados.md` foi atualizado.

## Checklist de remocao ou desativacao

- [ ] Confirmar motivo da remocao: sem uso, risco alto, falha frequente, duplicidade ou permissao excessiva.
- [ ] Revogar tokens e permissoes associados.
- [ ] Remover configuracoes locais quando aplicavel.
- [ ] Confirmar que o MCP nao aparece mais em `/mcp`.
- [ ] Registrar status como `removido` ou `rejeitado`.
- [ ] Registrar data e observacoes em `mcp-instalados.md`.
