create table if not exists public.base_conhecimento_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  descricao text null,
  cor text null default '#2563eb',
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint base_conhecimento_categorias_slug_formato_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.base_conhecimento_tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  tipo text not null default 'processo',
  cor text null default '#64748b',
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint base_conhecimento_tags_slug_formato_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint base_conhecimento_tags_tipo_check
    check (tipo in (
      'cliente',
      'equipamento',
      'fabricante',
      'servico',
      'processo',
      'erro',
      'ambiente',
      'contrato',
      'integracao',
      'nivel_tecnico'
    ))
);

alter table if exists public.bases_conhecimento
  add column if not exists slug text null,
  add column if not exists tipo text not null default 'procedimento',
  add column if not exists status text not null default 'rascunho',
  add column if not exists confidencialidade text not null default 'tecnico',
  add column if not exists publico_alvo text not null default 'tecnico',
  add column if not exists categoria_id uuid null references public.base_conhecimento_categorias(id),
  add column if not exists publicado_em timestamptz null,
  add column if not exists revisado_em timestamptz null,
  add column if not exists proxima_revisao_em date null,
  add column if not exists publicado_por uuid null references auth.users(id),
  add column if not exists revisado_por uuid null references auth.users(id);

update public.bases_conhecimento
   set slug = coalesce(
     nullif(
       regexp_replace(
         trim(
           regexp_replace(
             lower(coalesce(titulo, id::text)),
             '[^a-z0-9]+',
             '-',
             'g'
           )
         ),
         '(^-|-$)',
         '',
         'g'
       ),
       ''
     ),
     id::text
   )
 where slug is null
   and to_regclass('public.bases_conhecimento') is not null;

update public.bases_conhecimento
   set status = case when ativo then 'publicado' else 'arquivado' end,
       publicado_em = case when ativo and publicado_em is null then atualizado_em else publicado_em end,
       publicado_por = case when ativo and publicado_por is null then coalesce(atualizado_por, criado_por) else publicado_por end
 where status = 'rascunho'
   and (ativo = true or ativo = false);

do $$
begin
  if to_regclass('public.bases_conhecimento') is not null then
    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_slug_formato_check'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_slug_formato_check
        check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
    end if;

    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_tipo_check'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_tipo_check
        check (tipo in (
          'procedimento',
          'faq',
          'erro_conhecido',
          'workaround',
          'manual_tecnico',
          'checklist',
          'orientacao_cliente',
          'padrao_interno',
          'solucao_recorrente'
        ));
    end if;

    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_status_check'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_status_check
        check (status in ('rascunho', 'em_revisao', 'publicado', 'arquivado'));
    end if;

    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_confidencialidade_check'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_confidencialidade_check
        check (confidencialidade in (
          'publica',
          'cliente_especifico',
          'tecnico',
          'interno_restrito',
          'confidencial'
        ));
    end if;

    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_publico_alvo_check'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_publico_alvo_check
        check (publico_alvo in ('cliente', 'tecnico', 'interno', 'gestao'));
    end if;
  end if;
end $$;

create table if not exists public.base_conhecimento_artigo_tags (
  artigo_id uuid not null references public.bases_conhecimento(id) on delete cascade,
  tag_id uuid not null references public.base_conhecimento_tags(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  primary key (artigo_id, tag_id)
);

create table if not exists public.base_conhecimento_anexos (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.bases_conhecimento(id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null,
  tipo_mime text null,
  tamanho_bytes bigint null,
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  constraint base_conhecimento_anexos_tamanho_check
    check (tamanho_bytes is null or tamanho_bytes > 0),
  constraint base_conhecimento_anexos_caminho_bucket_check
    check (caminho_storage like 'artigos/%')
);

create unique index if not exists base_conhecimento_categorias_slug_key
  on public.base_conhecimento_categorias (slug);

create unique index if not exists base_conhecimento_categorias_nome_key
  on public.base_conhecimento_categorias (lower(nome));

create unique index if not exists base_conhecimento_tags_slug_key
  on public.base_conhecimento_tags (slug);

create unique index if not exists base_conhecimento_tags_nome_key
  on public.base_conhecimento_tags (lower(nome));

create unique index if not exists bases_conhecimento_slug_key
  on public.bases_conhecimento (slug)
  where slug is not null;

create index if not exists bases_conhecimento_status_idx
  on public.bases_conhecimento (status, ativo);

create index if not exists bases_conhecimento_categoria_id_idx
  on public.bases_conhecimento (categoria_id);

create index if not exists base_conhecimento_artigo_tags_tag_idx
  on public.base_conhecimento_artigo_tags (tag_id);

create index if not exists base_conhecimento_anexos_artigo_idx
  on public.base_conhecimento_anexos (artigo_id);

drop trigger if exists trg_base_conhecimento_categorias_updated_at
  on public.base_conhecimento_categorias;
create trigger trg_base_conhecimento_categorias_updated_at
  before update on public.base_conhecimento_categorias
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_base_conhecimento_tags_updated_at
  on public.base_conhecimento_tags;
create trigger trg_base_conhecimento_tags_updated_at
  before update on public.base_conhecimento_tags
  for each row execute function public.atualizar_atualizado_em();

insert into public.base_conhecimento_categorias (nome, slug, descricao, cor, ordem)
values
  ('Procedimentos técnicos', 'procedimentos-tecnicos', 'Procedimentos operacionais para atendimento e diagnóstico técnico.', '#2563eb', 10),
  ('Erros conhecidos', 'erros-conhecidos', 'Falhas recorrentes, causas prováveis e contornos validados.', '#dc2626', 20),
  ('Checklists', 'checklists', 'Listas de verificação para execução em campo ou suporte remoto.', '#16a34a', 30)
on conflict (slug) do update
   set nome = excluded.nome,
       descricao = excluded.descricao,
       cor = excluded.cor,
       ordem = excluded.ordem,
       ativo = true;

update public.bases_conhecimento b
   set categoria_id = c.id
  from public.base_conhecimento_categorias c
 where b.categoria_id is null
   and c.slug = 'procedimentos-tecnicos';

alter table public.base_conhecimento_categorias enable row level security;
alter table public.base_conhecimento_tags enable row level security;
alter table public.base_conhecimento_artigo_tags enable row level security;
alter table public.base_conhecimento_anexos enable row level security;
alter table public.bases_conhecimento enable row level security;

grant select, insert, update on table public.base_conhecimento_categorias to authenticated;
grant select, insert, update on table public.base_conhecimento_tags to authenticated;
grant select, insert, update on table public.base_conhecimento_artigo_tags to authenticated;
grant select, insert, update on table public.base_conhecimento_anexos to authenticated;

grant references on table public.base_conhecimento_categorias to authenticated;
grant references on table public.base_conhecimento_tags to authenticated;
grant references on table public.bases_conhecimento to authenticated;

revoke delete on table public.base_conhecimento_categorias from anon, authenticated;
revoke delete on table public.base_conhecimento_tags from anon, authenticated;
revoke delete on table public.base_conhecimento_artigo_tags from anon, authenticated;
revoke delete on table public.base_conhecimento_anexos from anon, authenticated;
revoke delete on table public.bases_conhecimento from anon, authenticated;

drop policy if exists base_conhecimento_categorias_select_operacionais
  on public.base_conhecimento_categorias;
create policy base_conhecimento_categorias_select_operacionais
  on public.base_conhecimento_categorias
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (ativo = true and public.usuario_acesso_chamados_ativo())
  );

drop policy if exists base_conhecimento_categorias_insert_catalogo
  on public.base_conhecimento_categorias;
create policy base_conhecimento_categorias_insert_catalogo
  on public.base_conhecimento_categorias
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_categorias_update_catalogo
  on public.base_conhecimento_categorias;
create policy base_conhecimento_categorias_update_catalogo
  on public.base_conhecimento_categorias
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists base_conhecimento_tags_select_operacionais
  on public.base_conhecimento_tags;
create policy base_conhecimento_tags_select_operacionais
  on public.base_conhecimento_tags
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (ativo = true and public.usuario_acesso_chamados_ativo())
  );

drop policy if exists base_conhecimento_tags_insert_catalogo
  on public.base_conhecimento_tags;
create policy base_conhecimento_tags_insert_catalogo
  on public.base_conhecimento_tags
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_tags_update_catalogo
  on public.base_conhecimento_tags;
create policy base_conhecimento_tags_update_catalogo
  on public.base_conhecimento_tags
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists bases_conhecimento_select_ativos
  on public.bases_conhecimento;
drop policy if exists bases_conhecimento_select_operacional_editorial
  on public.bases_conhecimento;
create policy bases_conhecimento_select_operacional_editorial
  on public.bases_conhecimento
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (
      ativo = true
      and status = 'publicado'
      and confidencialidade in ('publica', 'tecnico', 'interno_restrito')
      and exists (
        select 1
          from public.perfis p
         where p.id = auth.uid()
           and p.ativo = true
           and p.papel::text in (
             'super_admin',
             'admin',
             'analista',
             'tecnico_quarta',
             'tecnico_terceirizado'
           )
      )
    )
  );

drop policy if exists bases_conhecimento_insert_catalogo
  on public.bases_conhecimento;
create policy bases_conhecimento_insert_catalogo
  on public.bases_conhecimento
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists bases_conhecimento_update_catalogo
  on public.bases_conhecimento;
create policy bases_conhecimento_update_catalogo
  on public.bases_conhecimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists base_conhecimento_artigo_tags_select_operacionais
  on public.base_conhecimento_artigo_tags;
create policy base_conhecimento_artigo_tags_select_operacionais
  on public.base_conhecimento_artigo_tags
  for select
  to authenticated
  using (
    ativo = true
    and
    exists (
      select 1
        from public.bases_conhecimento b
       where b.id = artigo_id
    )
  );

drop policy if exists base_conhecimento_artigo_tags_insert_catalogo
  on public.base_conhecimento_artigo_tags;
create policy base_conhecimento_artigo_tags_insert_catalogo
  on public.base_conhecimento_artigo_tags
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_artigo_tags_update_catalogo
  on public.base_conhecimento_artigo_tags;
create policy base_conhecimento_artigo_tags_update_catalogo
  on public.base_conhecimento_artigo_tags
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists base_conhecimento_anexos_select_operacionais
  on public.base_conhecimento_anexos;
create policy base_conhecimento_anexos_select_operacionais
  on public.base_conhecimento_anexos
  for select
  to authenticated
  using (
    ativo = true
    and exists (
      select 1
        from public.bases_conhecimento b
       where b.id = artigo_id
    )
  );

drop policy if exists base_conhecimento_anexos_insert_catalogo
  on public.base_conhecimento_anexos;
create policy base_conhecimento_anexos_insert_catalogo
  on public.base_conhecimento_anexos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_anexos_update_catalogo
  on public.base_conhecimento_anexos;
create policy base_conhecimento_anexos_update_catalogo
  on public.base_conhecimento_anexos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

insert into storage.buckets (id, name, public)
values ('base-conhecimento-anexos', 'base-conhecimento-anexos', false)
on conflict (id) do update
   set public = false;

drop policy if exists base_conhecimento_storage_select_operacionais
  on storage.objects;
create policy base_conhecimento_storage_select_operacionais
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'base-conhecimento-anexos'
    and exists (
      select 1
        from public.base_conhecimento_anexos a
       where a.caminho_storage = name
         and a.ativo = true
    )
  );

drop policy if exists base_conhecimento_storage_insert_catalogo
  on storage.objects;
create policy base_conhecimento_storage_insert_catalogo
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'base-conhecimento-anexos'
    and name like 'artigos/%'
    and public.usuario_catalogo_chamados_ativo()
  );

drop policy if exists base_conhecimento_storage_update_catalogo
  on storage.objects;
create policy base_conhecimento_storage_update_catalogo
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'base-conhecimento-anexos'
    and name like 'artigos/%'
    and public.usuario_catalogo_chamados_ativo()
  )
  with check (
    bucket_id = 'base-conhecimento-anexos'
    and name like 'artigos/%'
    and public.usuario_catalogo_chamados_ativo()
  );
