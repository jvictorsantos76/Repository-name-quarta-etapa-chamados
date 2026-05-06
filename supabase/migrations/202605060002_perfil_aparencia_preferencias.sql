alter table if exists public.perfis
  add column if not exists tema_preferido text not null default 'system',
  add column if not exists cor_preferida text not null default 'quarta-etapa',
  add column if not exists fonte_escala text not null default 'padrao';

do $$
begin
  if to_regclass('public.perfis') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.perfis'::regclass
        and conname = 'perfis_tema_preferido_check'
    ) then
      alter table public.perfis
        add constraint perfis_tema_preferido_check
        check (tema_preferido in ('system', 'light', 'dark'));
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.perfis'::regclass
        and conname = 'perfis_cor_preferida_check'
    ) then
      alter table public.perfis
        add constraint perfis_cor_preferida_check
        check (cor_preferida in ('quarta-etapa', 'verde', 'roxo', 'laranja', 'neutro'));
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.perfis'::regclass
        and conname = 'perfis_fonte_escala_check'
    ) then
      alter table public.perfis
        add constraint perfis_fonte_escala_check
        check (fonte_escala in ('padrao', 'grande', 'extra_grande'));
    end if;

    grant select on table public.perfis to authenticated;
    grant update (
      telefone,
      avatar_url,
      biografia,
      tema_preferido,
      cor_preferida,
      fonte_escala
    ) on table public.perfis to authenticated;
  end if;
end $$;
