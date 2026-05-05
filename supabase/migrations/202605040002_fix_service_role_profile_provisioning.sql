do $$
begin
  if to_regclass('public.perfis') is not null then
    grant select, insert, update on table public.perfis to service_role;
    revoke select on table public.perfis from anon;
    drop policy if exists dev_select_perfis on public.perfis;
  end if;

  if to_regclass('public.solicitacoes_acesso') is not null then
    grant select, update on table public.solicitacoes_acesso to service_role;
  end if;

  if to_regclass('public.aceites_legais') is not null then
    grant select, update on table public.aceites_legais to service_role;
  end if;
end $$;
