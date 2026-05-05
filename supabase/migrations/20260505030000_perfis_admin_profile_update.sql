do $$
begin
  if to_regclass('public.perfis') is not null
    and to_regprocedure('public.usuario_admin_usuarios_ativo()') is not null then
    grant update (telefone, avatar_url, biografia)
      on table public.perfis
      to authenticated;

    drop policy if exists perfis_update_admin_basico on public.perfis;

    create policy perfis_update_admin_basico
      on public.perfis
      for update
      to authenticated
      using (public.usuario_admin_usuarios_ativo())
      with check (public.usuario_admin_usuarios_ativo());
  end if;
end $$;
