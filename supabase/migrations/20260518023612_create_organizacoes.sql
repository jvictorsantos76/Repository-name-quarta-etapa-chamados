create table if not exists public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo_interno text null,
  tipo_organizacao text not null default 'cliente',
  possui_filiais boolean not null default false,
  ativo boolean not null default true,
  observacoes text null,
  logo_url text null,
  cor_identificacao text null,
  sistema_externo_padrao text null,
  id_externo text null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id)
);

alter table public.organizacoes
  add column if not exists id uuid,
  add column if not exists nome text,
  add column if not exists codigo_interno text,
  add column if not exists tipo_organizacao text,
  add column if not exists possui_filiais boolean,
  add column if not exists ativo boolean,
  add column if not exists observacoes text,
  add column if not exists logo_url text,
  add column if not exists cor_identificacao text,
  add column if not exists sistema_externo_padrao text,
  add column if not exists id_externo text,
  add column if not exists criado_em timestamptz,
  add column if not exists atualizado_em timestamptz,
  add column if not exists criado_por uuid references auth.users(id),
  add column if not exists atualizado_por uuid references auth.users(id);

alter table public.organizacoes
  alter column id set default gen_random_uuid(),
  alter column tipo_organizacao set default 'cliente',
  alter column possui_filiais set default false,
  alter column ativo set default true,
  alter column criado_em set default now(),
  alter column atualizado_em set default now();

update public.organizacoes
   set id = gen_random_uuid()
 where id is null;

update public.organizacoes
   set tipo_organizacao = 'cliente'
 where tipo_organizacao is null;

update public.organizacoes
   set possui_filiais = false
 where possui_filiais is null;

update public.organizacoes
   set ativo = true
 where ativo is null;

update public.organizacoes
   set criado_em = now()
 where criado_em is null;

update public.organizacoes
   set atualizado_em = now()
 where atualizado_em is null;

do $$
begin
  if exists (
    select 1
      from public.organizacoes
     where nome is null
        or btrim(nome) = ''
  ) then
    raise exception 'public.organizacoes possui registros sem nome válido.';
  end if;

  alter table public.organizacoes
    alter column id set not null,
    alter column nome set not null,
    alter column tipo_organizacao set not null,
    alter column possui_filiais set not null,
    alter column ativo set not null,
    alter column criado_em set not null,
    alter column atualizado_em set not null;
end $$;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.organizacoes'::regclass
       and contype = 'p'
  ) then
    alter table public.organizacoes
      add constraint organizacoes_pkey primary key (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.organizacoes'::regclass
       and conname = 'organizacoes_nome_nao_vazio_check'
  ) then
    alter table public.organizacoes
      add constraint organizacoes_nome_nao_vazio_check
      check (btrim(nome) <> '');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.organizacoes'::regclass
       and conname = 'organizacoes_tipo_organizacao_check'
  ) then
    alter table public.organizacoes
      add constraint organizacoes_tipo_organizacao_check
      check (
        tipo_organizacao in (
          'cliente',
          'parceiro',
          'interno',
          'grupo_economico',
          'fornecedor',
          'fabricante',
          'orgao_publico',
          'outro'
        )
      );
  end if;
end $$;

create index if not exists organizacoes_ativo_idx
  on public.organizacoes (ativo);

create index if not exists organizacoes_tipo_organizacao_idx
  on public.organizacoes (tipo_organizacao);

create index if not exists organizacoes_nome_idx
  on public.organizacoes (nome);

create index if not exists organizacoes_id_externo_idx
  on public.organizacoes (id_externo);

create unique index if not exists organizacoes_codigo_interno_unique_idx
  on public.organizacoes (lower(btrim(codigo_interno)))
  where codigo_interno is not null and btrim(codigo_interno) <> '';

drop trigger if exists trg_organizacoes_updated_at on public.organizacoes;
create trigger trg_organizacoes_updated_at
  before update on public.organizacoes
  for each row execute function public.atualizar_atualizado_em();

alter table public.organizacoes enable row level security;

grant select, insert, update on table public.organizacoes to authenticated;
revoke delete on table public.organizacoes from anon, authenticated;

drop policy if exists organizacoes_select_acesso on public.organizacoes;
create policy organizacoes_select_acesso
  on public.organizacoes
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (
      ativo = true
      and public.usuario_acesso_chamados_ativo()
    )
  );

drop policy if exists organizacoes_insert_catalogo on public.organizacoes;
create policy organizacoes_insert_catalogo
  on public.organizacoes
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists organizacoes_update_catalogo on public.organizacoes;
create policy organizacoes_update_catalogo
  on public.organizacoes
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());
