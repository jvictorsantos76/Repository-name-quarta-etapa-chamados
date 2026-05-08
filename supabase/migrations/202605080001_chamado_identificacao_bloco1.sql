do $$
begin
  if to_regclass('public.perfis') is not null then
    create or replace function public.usuario_catalogo_chamados_ativo()
    returns boolean
    language sql
    security definer
    set search_path = public
    as $function$
      select exists (
        select 1
        from public.perfis
        where id = auth.uid()
          and ativo = true
          and papel in ('super_admin', 'admin', 'gestor', 'analista')
      );
    $function$;

    grant execute on function public.usuario_catalogo_chamados_ativo() to authenticated;
  end if;
end $$;

create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
as $function$
begin
  new.atualizado_em = now();
  return new;
end;
$function$;

create table if not exists public.chamado_tipos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id)
);

create table if not exists public.chamado_origens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id)
);

create table if not exists public.grupos_atendimento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id)
);

create table if not exists public.bases_conhecimento (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  url text null,
  resumo text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  constraint bases_conhecimento_url_check
    check (url is null or url ~* '^https?://')
);

create table if not exists public.chamados_bases_conhecimento (
  chamado_id uuid not null references public.chamados(id) on delete cascade,
  base_conhecimento_id uuid not null references public.bases_conhecimento(id),
  criado_em timestamptz not null default now(),
  primary key (chamado_id, base_conhecimento_id)
);

create unique index if not exists chamado_tipos_nome_lower_key
  on public.chamado_tipos (lower(nome));

create unique index if not exists chamado_origens_nome_lower_key
  on public.chamado_origens (lower(nome));

create unique index if not exists grupos_atendimento_nome_lower_key
  on public.grupos_atendimento (lower(nome));

create unique index if not exists bases_conhecimento_titulo_lower_key
  on public.bases_conhecimento (lower(titulo));

alter table if exists public.chamados
  add column if not exists tipo_chamado_id uuid null references public.chamado_tipos(id),
  add column if not exists origem_id uuid null references public.chamado_origens(id),
  add column if not exists id_externo text null,
  add column if not exists organizacao_id uuid null references public.clientes(id),
  add column if not exists grupo_atendimento_id uuid null references public.grupos_atendimento(id);

create index if not exists idx_chamados_tipo_chamado_id
  on public.chamados (tipo_chamado_id);

create index if not exists idx_chamados_origem_id
  on public.chamados (origem_id);

create index if not exists idx_chamados_organizacao_id
  on public.chamados (organizacao_id);

create index if not exists idx_chamados_grupo_atendimento_id
  on public.chamados (grupo_atendimento_id);

create index if not exists idx_chamados_bases_base_id
  on public.chamados_bases_conhecimento (base_conhecimento_id);

drop trigger if exists trg_chamado_tipos_updated_at on public.chamado_tipos;
create trigger trg_chamado_tipos_updated_at
  before update on public.chamado_tipos
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_chamado_origens_updated_at on public.chamado_origens;
create trigger trg_chamado_origens_updated_at
  before update on public.chamado_origens
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_grupos_atendimento_updated_at on public.grupos_atendimento;
create trigger trg_grupos_atendimento_updated_at
  before update on public.grupos_atendimento
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_bases_conhecimento_updated_at on public.bases_conhecimento;
create trigger trg_bases_conhecimento_updated_at
  before update on public.bases_conhecimento
  for each row execute function public.atualizar_atualizado_em();

insert into public.chamado_tipos (nome)
values ('Incidente'), ('Requisição de Serviço')
on conflict (lower(nome)) do nothing;

insert into public.chamado_origens (nome)
values ('Sistema'), ('Portal'), ('WhatsApp'), ('E-mail'), ('Jira'), ('Integração')
on conflict (lower(nome)) do nothing;

insert into public.grupos_atendimento (nome)
values ('Service Desk'), ('Field Service'), ('N1'), ('N2'), ('Administrativo')
on conflict (lower(nome)) do nothing;

alter table public.chamado_tipos enable row level security;
alter table public.chamado_origens enable row level security;
alter table public.grupos_atendimento enable row level security;
alter table public.bases_conhecimento enable row level security;
alter table public.chamados_bases_conhecimento enable row level security;

grant select, insert, update on table public.chamado_tipos to authenticated;
grant select, insert, update on table public.chamado_origens to authenticated;
grant select, insert, update on table public.grupos_atendimento to authenticated;
grant select, insert, update on table public.bases_conhecimento to authenticated;
grant select, insert on table public.chamados_bases_conhecimento to authenticated;
grant references on table public.chamado_tipos to authenticated;
grant references on table public.chamado_origens to authenticated;
grant references on table public.grupos_atendimento to authenticated;
grant references on table public.bases_conhecimento to authenticated;

grant insert, update on table public.clientes to authenticated;

drop policy if exists chamado_tipos_select_ativos on public.chamado_tipos;
create policy chamado_tipos_select_ativos
  on public.chamado_tipos
  for select
  to authenticated
  using (ativo = true and public.usuario_operacional_ativo());

drop policy if exists chamado_tipos_insert_catalogo on public.chamado_tipos;
create policy chamado_tipos_insert_catalogo
  on public.chamado_tipos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists chamado_tipos_update_catalogo on public.chamado_tipos;
create policy chamado_tipos_update_catalogo
  on public.chamado_tipos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists chamado_origens_select_ativos on public.chamado_origens;
create policy chamado_origens_select_ativos
  on public.chamado_origens
  for select
  to authenticated
  using (ativo = true and public.usuario_operacional_ativo());

drop policy if exists chamado_origens_insert_catalogo on public.chamado_origens;
create policy chamado_origens_insert_catalogo
  on public.chamado_origens
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists chamado_origens_update_catalogo on public.chamado_origens;
create policy chamado_origens_update_catalogo
  on public.chamado_origens
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists grupos_atendimento_select_ativos on public.grupos_atendimento;
create policy grupos_atendimento_select_ativos
  on public.grupos_atendimento
  for select
  to authenticated
  using (ativo = true and public.usuario_operacional_ativo());

drop policy if exists grupos_atendimento_insert_catalogo on public.grupos_atendimento;
create policy grupos_atendimento_insert_catalogo
  on public.grupos_atendimento
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists grupos_atendimento_update_catalogo on public.grupos_atendimento;
create policy grupos_atendimento_update_catalogo
  on public.grupos_atendimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists bases_conhecimento_select_ativos on public.bases_conhecimento;
create policy bases_conhecimento_select_ativos
  on public.bases_conhecimento
  for select
  to authenticated
  using (ativo = true and public.usuario_operacional_ativo());

drop policy if exists bases_conhecimento_insert_catalogo on public.bases_conhecimento;
create policy bases_conhecimento_insert_catalogo
  on public.bases_conhecimento
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists bases_conhecimento_update_catalogo on public.bases_conhecimento;
create policy bases_conhecimento_update_catalogo
  on public.bases_conhecimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists chamados_bases_select_operacionais on public.chamados_bases_conhecimento;
create policy chamados_bases_select_operacionais
  on public.chamados_bases_conhecimento
  for select
  to authenticated
  using (public.usuario_operacional_ativo());

drop policy if exists chamados_bases_insert_operacionais on public.chamados_bases_conhecimento;
create policy chamados_bases_insert_operacionais
  on public.chamados_bases_conhecimento
  for insert
  to authenticated
  with check (
    public.usuario_operacional_ativo()
    and exists (
      select 1
      from public.chamados c
      where c.id = chamado_id
        and c.operador_id = auth.uid()
    )
  );

drop policy if exists clientes_insert_catalogo_chamados on public.clientes;
create policy clientes_insert_catalogo_chamados
  on public.clientes
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists clientes_update_catalogo_chamados on public.clientes;
create policy clientes_update_catalogo_chamados
  on public.clientes
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());
