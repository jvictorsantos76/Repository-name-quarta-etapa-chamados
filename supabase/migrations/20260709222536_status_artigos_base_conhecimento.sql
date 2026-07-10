create table if not exists public.base_conhecimento_status (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nome text not null,
  descricao text null,
  cor text null default '#64748b',
  ordem integer not null default 0,
  ativo boolean not null default true,
  eh_padrao boolean not null default false,
  publica_artigo boolean not null default false,
  arquiva_artigo boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint base_conhecimento_status_codigo_formato_check
    check (codigo ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint base_conhecimento_status_cor_check
    check (cor is null or cor ~* '^#[0-9a-f]{6}$')
);

create table if not exists public.base_conhecimento_tipos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nome text not null,
  descricao text null,
  ordem integer not null default 0,
  ativo boolean not null default true,
  eh_padrao boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint base_conhecimento_tipos_codigo_formato_check
    check (codigo ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$')
);

create table if not exists public.base_conhecimento_organizacoes (
  artigo_id uuid not null references public.bases_conhecimento(id) on delete cascade,
  organizacao_id uuid not null references public.organizacoes(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  primary key (artigo_id, organizacao_id)
);

create unique index if not exists base_conhecimento_tipos_codigo_key
  on public.base_conhecimento_tipos (codigo);

create unique index if not exists base_conhecimento_tipos_nome_key
  on public.base_conhecimento_tipos (lower(nome));

create unique index if not exists base_conhecimento_tipos_um_padrao_idx
  on public.base_conhecimento_tipos (eh_padrao)
  where eh_padrao = true and ativo = true;

create index if not exists base_conhecimento_organizacoes_organizacao_idx
  on public.base_conhecimento_organizacoes (organizacao_id)
  where ativo = true;

create unique index if not exists base_conhecimento_status_codigo_key
  on public.base_conhecimento_status (codigo);

create unique index if not exists base_conhecimento_status_nome_key
  on public.base_conhecimento_status (lower(nome));

create unique index if not exists base_conhecimento_status_um_padrao_idx
  on public.base_conhecimento_status (eh_padrao)
  where eh_padrao = true and ativo = true;

create unique index if not exists base_conhecimento_status_um_publicado_idx
  on public.base_conhecimento_status (publica_artigo)
  where publica_artigo = true and ativo = true;

create unique index if not exists base_conhecimento_status_um_arquivado_idx
  on public.base_conhecimento_status (arquiva_artigo)
  where arquiva_artigo = true and ativo = true;

drop trigger if exists trg_base_conhecimento_status_updated_at
  on public.base_conhecimento_status;
create trigger trg_base_conhecimento_status_updated_at
  before update on public.base_conhecimento_status
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_base_conhecimento_tipos_updated_at
  on public.base_conhecimento_tipos;
create trigger trg_base_conhecimento_tipos_updated_at
  before update on public.base_conhecimento_tipos
  for each row execute function public.atualizar_atualizado_em();

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
  ('rascunho', 'Rascunho', 'Artigo em elaboração, ainda sem publicação operacional.', '#64748b', 10, true, true, false, false),
  ('em_revisao', 'Em revisão', 'Artigo aguardando validação técnica antes da publicação.', '#d97706', 20, true, false, false, false),
  ('publicado', 'Publicado', 'Artigo liberado para consulta pelos perfis autorizados.', '#16a34a', 30, true, false, true, false),
  ('arquivado', 'Arquivado', 'Artigo retirado da consulta operacional, mantido para histórico.', '#dc2626', 40, true, false, false, true)
on conflict (codigo) do update
   set nome = excluded.nome,
       descricao = excluded.descricao,
       cor = excluded.cor,
       ordem = excluded.ordem,
       ativo = excluded.ativo,
       eh_padrao = excluded.eh_padrao,
       publica_artigo = excluded.publica_artigo,
       arquiva_artigo = excluded.arquiva_artigo;

insert into public.base_conhecimento_tipos (
  codigo,
  nome,
  descricao,
  ordem,
  ativo,
  eh_padrao
)
values
  ('procedimento', 'Procedimento', 'Procedimento operacional ou técnico executável.', 10, true, true),
  ('faq', 'FAQ', 'Pergunta e resposta recorrente.', 20, true, false),
  ('erro_conhecido', 'Erro conhecido', 'Falha conhecida com causa ou contorno documentado.', 30, true, false),
  ('workaround', 'Workaround', 'Solução temporária para manter a operação.', 40, true, false),
  ('manual_tecnico', 'Manual técnico', 'Instrução técnica detalhada ou referência de equipamento.', 50, true, false),
  ('checklist', 'Checklist', 'Lista de verificação operacional.', 60, true, false),
  ('orientacao_cliente', 'Orientação ao cliente', 'Orientação de comunicação ou autosserviço.', 70, true, false),
  ('padrao_interno', 'Padrão interno', 'Norma ou diretriz interna de atendimento.', 80, true, false),
  ('solucao_recorrente', 'Solução recorrente', 'Solução aplicada em incidentes frequentes.', 90, true, false)
on conflict (codigo) do update
   set nome = excluded.nome,
       descricao = excluded.descricao,
       ordem = excluded.ordem,
       ativo = excluded.ativo,
       eh_padrao = excluded.eh_padrao;

do $$
begin
  if to_regclass('public.bases_conhecimento') is not null then
    alter table public.bases_conhecimento
      drop constraint if exists bases_conhecimento_status_check;

    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_status_codigo_fkey'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_status_codigo_fkey
        foreign key (status)
        references public.base_conhecimento_status(codigo);
    end if;

    alter table public.bases_conhecimento
      drop constraint if exists bases_conhecimento_tipo_check;

    if not exists (
      select 1
        from pg_constraint
       where conrelid = 'public.bases_conhecimento'::regclass
         and conname = 'bases_conhecimento_tipo_codigo_fkey'
    ) then
      alter table public.bases_conhecimento
        add constraint bases_conhecimento_tipo_codigo_fkey
        foreign key (tipo)
        references public.base_conhecimento_tipos(codigo);
    end if;
  end if;
end $$;

alter table public.base_conhecimento_status enable row level security;
alter table public.base_conhecimento_tipos enable row level security;
alter table public.base_conhecimento_organizacoes enable row level security;

grant select, insert, update on table public.base_conhecimento_status to authenticated;
grant references on table public.base_conhecimento_status to authenticated;
revoke delete on table public.base_conhecimento_status from anon, authenticated;
grant select, insert, update on table public.base_conhecimento_tipos to authenticated;
grant references on table public.base_conhecimento_tipos to authenticated;
revoke delete on table public.base_conhecimento_tipos from anon, authenticated;
grant select, insert, update on table public.base_conhecimento_organizacoes to authenticated;
revoke delete on table public.base_conhecimento_organizacoes from anon, authenticated;

drop policy if exists base_conhecimento_status_select_operacionais
  on public.base_conhecimento_status;
create policy base_conhecimento_status_select_operacionais
  on public.base_conhecimento_status
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (ativo = true and public.usuario_acesso_chamados_ativo())
  );

drop policy if exists base_conhecimento_status_insert_catalogo
  on public.base_conhecimento_status;
create policy base_conhecimento_status_insert_catalogo
  on public.base_conhecimento_status
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_status_update_catalogo
  on public.base_conhecimento_status;
create policy base_conhecimento_status_update_catalogo
  on public.base_conhecimento_status
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists base_conhecimento_tipos_select_operacionais
  on public.base_conhecimento_tipos;
create policy base_conhecimento_tipos_select_operacionais
  on public.base_conhecimento_tipos
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (ativo = true and public.usuario_acesso_chamados_ativo())
  );

drop policy if exists base_conhecimento_tipos_insert_catalogo
  on public.base_conhecimento_tipos;
create policy base_conhecimento_tipos_insert_catalogo
  on public.base_conhecimento_tipos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_tipos_update_catalogo
  on public.base_conhecimento_tipos;
create policy base_conhecimento_tipos_update_catalogo
  on public.base_conhecimento_tipos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists base_conhecimento_organizacoes_select_operacionais
  on public.base_conhecimento_organizacoes;
create policy base_conhecimento_organizacoes_select_operacionais
  on public.base_conhecimento_organizacoes
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (
      ativo = true
      and exists (
        select 1
          from public.bases_conhecimento b
         where b.id = artigo_id
           and b.ativo = true
      )
      and public.usuario_acesso_chamados_ativo()
    )
  );

drop policy if exists base_conhecimento_organizacoes_insert_catalogo
  on public.base_conhecimento_organizacoes;
create policy base_conhecimento_organizacoes_insert_catalogo
  on public.base_conhecimento_organizacoes
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_organizacoes_update_catalogo
  on public.base_conhecimento_organizacoes;
create policy base_conhecimento_organizacoes_update_catalogo
  on public.base_conhecimento_organizacoes
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

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
      and exists (
        select 1
          from public.base_conhecimento_status s
         where s.codigo = bases_conhecimento.status
           and s.ativo = true
           and s.publica_artigo = true
      )
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

drop policy if exists chamados_bases_insert_operacionais
  on public.chamados_bases_conhecimento;
create policy chamados_bases_insert_operacionais
  on public.chamados_bases_conhecimento
  for insert
  to authenticated
  with check (
    exists (
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
    and exists (
      select 1
        from public.bases_conhecimento b
        join public.base_conhecimento_status s on s.codigo = b.status
       where b.id = base_conhecimento_id
         and b.ativo = true
         and s.ativo = true
         and s.publica_artigo = true
    )
    and exists (
      select 1
        from public.chamados c
       where c.id = chamado_id
    )
  );
