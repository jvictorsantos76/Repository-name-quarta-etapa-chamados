create extension if not exists pgcrypto;

create table if not exists public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  email text not null,
  telefone text null,
  empresa text not null,
  cnpj text null,
  loja_unidade text null,
  cargo text null,
  motivo_acesso text null,
  status text not null default 'pendente_aprovacao',
  aprovado_por uuid null references public.perfis(id),
  aprovado_em timestamptz null,
  rejeitado_por uuid null references public.perfis(id),
  rejeitado_em timestamptz null,
  observacao_interna text null,
  aceite_termos boolean not null default false,
  aceite_privacidade boolean not null default false,
  ip_origem text null,
  user_agent text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint solicitacoes_acesso_status_check
    check (status in ('pendente_aprovacao', 'aprovado', 'rejeitado', 'cancelado'))
);

create unique index if not exists solicitacoes_acesso_email_pendente_idx
  on public.solicitacoes_acesso (lower(email))
  where status = 'pendente_aprovacao';

create table if not exists public.aceites_legais (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid null references public.perfis(id),
  solicitacao_acesso_id uuid null references public.solicitacoes_acesso(id),
  email text not null,
  tipo_documento text not null,
  versao_documento text not null,
  aceito_em timestamptz not null default now(),
  ip_origem text null,
  user_agent text null,
  constraint aceites_legais_tipo_documento_check
    check (tipo_documento in ('termos_uso', 'politica_privacidade'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists solicitacoes_acesso_set_updated_at
  on public.solicitacoes_acesso;

create trigger solicitacoes_acesso_set_updated_at
before update on public.solicitacoes_acesso
for each row
execute function public.set_updated_at();

create or replace function public.usuario_admin_ou_gestor_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
      and papel in ('admin', 'gestor')
  );
$$;

grant usage on schema public to anon, authenticated;
grant insert on table public.solicitacoes_acesso to anon;
grant insert on table public.aceites_legais to anon;
grant select, update on table public.solicitacoes_acesso to authenticated;
grant select on table public.aceites_legais to authenticated;
grant execute on function public.usuario_admin_ou_gestor_ativo() to authenticated;

alter table public.solicitacoes_acesso enable row level security;
alter table public.aceites_legais enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'solicitacoes_acesso'
      and policyname = 'solicitacoes_acesso_insert_publico'
  ) then
    create policy solicitacoes_acesso_insert_publico
      on public.solicitacoes_acesso
      for insert
      to anon
      with check (
        status = 'pendente_aprovacao'
        and aceite_termos = true
        and aceite_privacidade = true
        and nome_completo <> ''
        and email <> ''
        and empresa <> ''
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'solicitacoes_acesso'
      and policyname = 'solicitacoes_acesso_select_admin_gestor'
  ) then
    create policy solicitacoes_acesso_select_admin_gestor
      on public.solicitacoes_acesso
      for select
      to authenticated
      using (public.usuario_admin_ou_gestor_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'solicitacoes_acesso'
      and policyname = 'solicitacoes_acesso_update_admin_gestor'
  ) then
    create policy solicitacoes_acesso_update_admin_gestor
      on public.solicitacoes_acesso
      for update
      to authenticated
      using (public.usuario_admin_ou_gestor_ativo())
      with check (
        public.usuario_admin_ou_gestor_ativo()
        and status in ('pendente_aprovacao', 'aprovado', 'rejeitado', 'cancelado')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'aceites_legais'
      and policyname = 'aceites_legais_insert_publico'
  ) then
    create policy aceites_legais_insert_publico
      on public.aceites_legais
      for insert
      to anon
      with check (
        solicitacao_acesso_id is not null
        and perfil_id is null
        and email <> ''
        and tipo_documento in ('termos_uso', 'politica_privacidade')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'aceites_legais'
      and policyname = 'aceites_legais_select_admin_gestor'
  ) then
    create policy aceites_legais_select_admin_gestor
      on public.aceites_legais
      for select
      to authenticated
      using (public.usuario_admin_ou_gestor_ativo());
  end if;
end $$;
