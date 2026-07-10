do $$
declare
  v_artigo_id uuid := '0b7f0c77-4a44-49ef-9e5a-8e56d977b4c1';
  v_anexo_id uuid := '87df1da0-c5be-45bc-9c0d-b632cd8debd5';
  v_usuario_id uuid;
  v_categoria_id uuid;
begin
  select p.id
    into v_usuario_id
    from public.perfis p
   where p.ativo = true
     and p.papel::text in ('super_admin', 'admin', 'analista')
   order by case p.papel::text
              when 'super_admin' then 1
              when 'admin' then 2
              else 3
            end,
            p.nome_completo
   limit 1;

  insert into public.base_conhecimento_categorias (
    nome,
    slug,
    descricao,
    cor,
    ordem,
    ativo,
    criado_por,
    atualizado_por
  )
  values (
    'Procedimentos tecnicos',
    'procedimentos-tecnicos',
    'Procedimentos, manuais e rotinas tecnicas de atendimento.',
    '#2563eb',
    10,
    true,
    v_usuario_id,
    v_usuario_id
  )
  on conflict (slug) do update
     set nome = excluded.nome,
         descricao = excluded.descricao,
         cor = excluded.cor,
         ordem = excluded.ordem,
         ativo = true,
         atualizado_por = excluded.atualizado_por;

  select c.id
    into v_categoria_id
    from public.base_conhecimento_categorias c
   where c.slug = 'procedimentos-tecnicos'
   limit 1;

  insert into public.bases_conhecimento (
    id,
    titulo,
    slug,
    tipo,
    status,
    confidencialidade,
    publico_alvo,
    categoria_id,
    url,
    resumo,
    conteudo,
    ordem,
    ativo,
    criado_por,
    atualizado_por,
    publicado_em,
    publicado_por,
    revisado_em,
    revisado_por,
    proxima_revisao_em
  )
  values (
    v_artigo_id,
    'MANUAL S4M',
    'manual-s4m',
    'manual_tecnico',
    'publicado',
    'cliente_especifico',
    'tecnico',
    v_categoria_id,
    'https://intranet.quartaetapa.local/base-conhecimento/manual-s4m',
    'Manual tecnico operacional para orientar triagem, validacao, atendimento e escalonamento de ocorrencias relacionadas ao ambiente S4M.',
    '<h2>Objetivo</h2><p>Padronizar o atendimento tecnico de chamados envolvendo o S4M, mantendo rastreabilidade, validacao minima e comunicacao clara com a operacao.</p><h2>Escopo</h2><ul><li>Triagem inicial de indisponibilidade, lentidao, erro de acesso e falha de integracao.</li><li>Registro de evidencias no chamado antes de qualquer escalonamento.</li><li>Orientacao para analistas e tecnicos autorizados.</li></ul><h2>Pre-requisitos</h2><ol><li>Confirmar cliente, unidade, solicitante e impacto operacional.</li><li>Validar se o chamado possui prints, horario da falha, usuario afetado e mensagem de erro.</li><li>Consultar status de conectividade, energia, rede local e acesso ao sistema antes de acionar suporte externo.</li></ol><h2>Procedimento de atendimento</h2><ol><li>Classificar o chamado como incidente ou solicitacao conforme descricao do usuario.</li><li>Registrar no chamado o horario informado, equipamento envolvido e acao ja executada pelo usuario.</li><li>Executar validacoes basicas: acesso, permissao, conectividade, navegador/aplicacao e ultima alteracao conhecida.</li><li>Aplicar workaround aprovado quando existir e registrar o resultado.</li><li>Escalonar com evidencias quando o problema depender de terceiro, fornecedor ou time responsavel pelo S4M.</li></ol><h2>Checklist de encerramento</h2><ul><li>Solucao aplicada registrada em linguagem objetiva.</li><li>Evidencias anexadas ou referenciadas.</li><li>Cliente/unidade validou normalizacao ou recebeu orientacao de acompanhamento.</li><li>Base de Conhecimento atualizada quando houver causa recorrente.</li></ul><h2>Governanca</h2><p>Nao registrar senhas, tokens, chaves de API ou dados sensiveis no artigo ou nos comentarios do chamado. Se houver informacao sensivel, usar canal seguro aprovado pela gestao.</p>',
    10,
    true,
    v_usuario_id,
    v_usuario_id,
    now(),
    v_usuario_id,
    now(),
    v_usuario_id,
    (current_date + interval '180 days')::date
  )
  on conflict (id) do update
     set titulo = excluded.titulo,
         slug = excluded.slug,
         tipo = excluded.tipo,
         status = excluded.status,
         confidencialidade = excluded.confidencialidade,
         publico_alvo = excluded.publico_alvo,
         categoria_id = excluded.categoria_id,
         url = excluded.url,
         resumo = excluded.resumo,
         conteudo = excluded.conteudo,
         ordem = excluded.ordem,
         ativo = excluded.ativo,
         atualizado_por = excluded.atualizado_por,
         publicado_em = coalesce(public.bases_conhecimento.publicado_em, excluded.publicado_em),
         publicado_por = coalesce(public.bases_conhecimento.publicado_por, excluded.publicado_por),
         revisado_em = excluded.revisado_em,
         revisado_por = excluded.revisado_por,
         proxima_revisao_em = excluded.proxima_revisao_em;

  insert into public.base_conhecimento_tags (
    nome,
    slug,
    tipo,
    cor,
    descricao,
    ativo,
    criado_por,
    atualizado_por
  )
  values
    ('S4M', 's4m', 'ambiente', '#2563eb', 'Sistema ou ambiente relacionado ao atendimento S4M.', true, v_usuario_id, v_usuario_id),
    ('Manual tecnico', 'manual-tecnico', 'processo', '#0f766e', 'Conteudo de referencia tecnica para atendimento.', true, v_usuario_id, v_usuario_id),
    ('Triagem', 'triagem', 'processo', '#d97706', 'Procedimento de classificacao e validacao inicial.', true, v_usuario_id, v_usuario_id),
    ('Escalonamento', 'escalonamento', 'processo', '#7c3aed', 'Criterios de acionamento de suporte externo ou nivel superior.', true, v_usuario_id, v_usuario_id)
  on conflict (slug) do update
     set nome = excluded.nome,
         tipo = excluded.tipo,
         cor = excluded.cor,
         descricao = excluded.descricao,
         ativo = true,
         atualizado_por = excluded.atualizado_por;

  update public.base_conhecimento_artigo_tags
     set ativo = false
   where artigo_id = v_artigo_id;

  insert into public.base_conhecimento_artigo_tags (
    artigo_id,
    tag_id,
    ativo,
    criado_por
  )
  select v_artigo_id,
         t.id,
         true,
         v_usuario_id
    from public.base_conhecimento_tags t
   where t.slug in ('s4m', 'manual-tecnico', 'triagem', 'escalonamento')
  on conflict (artigo_id, tag_id) do update
     set ativo = true;

  update public.base_conhecimento_organizacoes
     set ativo = false
   where artigo_id = v_artigo_id;

  insert into public.base_conhecimento_organizacoes (
    artigo_id,
    organizacao_id,
    ativo,
    criado_por
  )
  select v_artigo_id,
         o.id,
         true,
         v_usuario_id
    from public.organizacoes o
   where o.ativo = true
     and o.tipo_organizacao in ('cliente', 'interno')
  on conflict (artigo_id, organizacao_id) do update
     set ativo = true;

  insert into public.base_conhecimento_anexos (
    id,
    artigo_id,
    nome_arquivo,
    caminho_storage,
    tipo_mime,
    tamanho_bytes,
    descricao,
    ativo,
    criado_por
  )
  values (
    v_anexo_id,
    v_artigo_id,
    'manual-s4m.html',
    'artigos/0b7f0c77-4a44-49ef-9e5a-8e56d977b4c1/manual-s4m.html',
    'text/html',
    2048,
    'Anexo HTML com o resumo operacional do Manual S4M.',
    true,
    v_usuario_id
  )
  on conflict (id) do update
     set artigo_id = excluded.artigo_id,
         nome_arquivo = excluded.nome_arquivo,
         caminho_storage = excluded.caminho_storage,
         tipo_mime = excluded.tipo_mime,
         descricao = excluded.descricao,
         ativo = true;
end $$;
