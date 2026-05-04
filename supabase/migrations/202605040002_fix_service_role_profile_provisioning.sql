grant select, insert, update on table public.perfis to service_role;
grant select, update on table public.solicitacoes_acesso to service_role;
grant select, update on table public.aceites_legais to service_role;

revoke select on table public.perfis from anon;
drop policy if exists dev_select_perfis on public.perfis;
