alter table if exists public.solicitacoes_acesso
  add column if not exists auth_user_id uuid null,
  add column if not exists perfil_id uuid null,
  add column if not exists provisionado_em timestamptz null,
  add column if not exists erro_provisionamento text null;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null
    and to_regclass('public.perfis') is not null then
    alter table public.solicitacoes_acesso
      add constraint solicitacoes_acesso_perfil_id_fkey
      foreign key (perfil_id) references public.perfis(id);
  end if;
exception
  when duplicate_object then null;
end $$;

create index if not exists solicitacoes_acesso_auth_user_id_idx
  on public.solicitacoes_acesso (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists solicitacoes_acesso_perfil_id_unique_idx
  on public.solicitacoes_acesso (perfil_id)
  where perfil_id is not null;
