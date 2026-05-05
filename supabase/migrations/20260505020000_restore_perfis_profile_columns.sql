alter table if exists public.perfis
  add column if not exists avatar_url text null,
  add column if not exists biografia text null,
  add column if not exists cargo text null,
  add column if not exists cliente_id uuid null,
  add column if not exists loja_id uuid null;

do $$
begin
  if to_regclass('public.perfis') is not null
    and to_regclass('public.clientes') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'perfis_cliente_id_fkey'
        and conrelid = 'public.perfis'::regclass
    ) then
    alter table public.perfis
      add constraint perfis_cliente_id_fkey
      foreign key (cliente_id) references public.clientes(id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.perfis') is not null
    and to_regclass('public.lojas') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'perfis_loja_id_fkey'
        and conrelid = 'public.perfis'::regclass
    ) then
    alter table public.perfis
      add constraint perfis_loja_id_fkey
      foreign key (loja_id) references public.lojas(id);
  end if;
end $$;

grant update (telefone, avatar_url, biografia) on table public.perfis to authenticated;
