do $$
begin
  if to_regclass('public.organizacoes') is not null then
    grant select, insert, update on table public.organizacoes to service_role;
    revoke delete on table public.organizacoes from anon, authenticated, service_role;
  end if;
end $$;
