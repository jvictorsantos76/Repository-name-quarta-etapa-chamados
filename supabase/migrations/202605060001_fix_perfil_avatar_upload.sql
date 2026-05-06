alter table if exists public.perfis
  add column if not exists telefone text null,
  add column if not exists avatar_url text null,
  add column if not exists biografia text null;

do $$
begin
  if to_regclass('public.perfis') is not null then
    revoke update on table public.perfis from authenticated;
    grant select on table public.perfis to authenticated;
    grant update (telefone, avatar_url, biografia)
      on table public.perfis
      to authenticated;

    drop policy if exists perfis_select_operacionais on public.perfis;
    create policy perfis_select_operacionais
      on public.perfis
      for select
      to authenticated
      using (
        id = auth.uid()
        or public.usuario_operacional_ativo()
      );

    drop policy if exists perfis_update_proprio_basico on public.perfis;
    create policy perfis_update_proprio_basico
      on public.perfis
      for update
      to authenticated
      using (id = auth.uid() and ativo = true)
      with check (id = auth.uid() and ativo = true);

    if to_regprocedure('public.usuario_admin_usuarios_ativo()') is not null then
      drop policy if exists perfis_update_admin_basico on public.perfis;
      create policy perfis_update_admin_basico
        on public.perfis
        for update
        to authenticated
        using (public.usuario_admin_usuarios_ativo())
        with check (public.usuario_admin_usuarios_ativo());
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('perfis', 'perfis', true)
    on conflict (id) do update
      set public = excluded.public;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'storage'
        and table_name = 'buckets'
        and column_name = 'file_size_limit'
    ) then
      execute $sql$
        update storage.buckets
        set file_size_limit = 5242880
        where id = 'perfis'
      $sql$;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'storage'
        and table_name = 'buckets'
        and column_name = 'allowed_mime_types'
    ) then
      execute $sql$
        update storage.buckets
        set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
        where id = 'perfis'
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists perfis_storage_select_autenticados on storage.objects;
    drop policy if exists perfis_storage_insert_proprio on storage.objects;

    create policy perfis_storage_select_autenticados
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'perfis'
        and auth.uid() is not null
      );

    create policy perfis_storage_insert_proprio
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'perfis'
        and auth.uid() is not null
        and name like ('perfis/' || auth.uid()::text || '/%')
      );
  end if;
end $$;
