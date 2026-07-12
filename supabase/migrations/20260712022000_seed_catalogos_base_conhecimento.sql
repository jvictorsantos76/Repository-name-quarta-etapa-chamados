-- Completa os registros-padrao caso a migration estrutural tenha sido aplicada
-- antes da inclusao dos seeds editoriais. Nao altera catalogos ja customizados.
insert into public.base_conhecimento_status (
  codigo,
  nome,
  descricao,
  cor,
  ordem,
  ativo,
  eh_padrao,
  publica_artigo,
  arquiva_artigo
)
values
  ('rascunho', 'Rascunho', 'Artigo em elaboracao, ainda sem publicacao operacional.', '#64748b', 10, true, true, false, false),
  ('em_revisao', 'Em revisao', 'Artigo aguardando validacao tecnica antes da publicacao.', '#d97706', 20, true, false, false, false),
  ('publicado', 'Publicado', 'Artigo liberado para consulta pelos perfis autorizados.', '#16a34a', 30, true, false, true, false),
  ('arquivado', 'Arquivado', 'Artigo retirado da consulta operacional, mantido para historico.', '#dc2626', 40, true, false, false, true)
on conflict (codigo) do nothing;

insert into public.base_conhecimento_tipos (
  codigo,
  nome,
  descricao,
  ordem,
  ativo,
  eh_padrao
)
values
  ('procedimento', 'Procedimento', 'Procedimento operacional ou tecnico executavel.', 10, true, true),
  ('faq', 'FAQ', 'Pergunta e resposta recorrente.', 20, true, false),
  ('erro_conhecido', 'Erro conhecido', 'Falha conhecida com causa ou contorno documentado.', 30, true, false),
  ('workaround', 'Workaround', 'Solucao temporaria para manter a operacao.', 40, true, false),
  ('manual_tecnico', 'Manual tecnico', 'Instrucao tecnica detalhada ou referencia de equipamento.', 50, true, false),
  ('checklist', 'Checklist', 'Lista de verificacao operacional.', 60, true, false),
  ('orientacao_cliente', 'Orientacao ao cliente', 'Orientacao de comunicacao ou autosservico.', 70, true, false),
  ('padrao_interno', 'Padrao interno', 'Norma ou diretriz interna de atendimento.', 80, true, false),
  ('solucao_recorrente', 'Solucao recorrente', 'Solucao aplicada em incidentes frequentes.', 90, true, false)
on conflict (codigo) do nothing;
