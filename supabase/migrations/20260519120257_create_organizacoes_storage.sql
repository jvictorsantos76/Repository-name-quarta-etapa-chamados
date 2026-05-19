do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('organizacoes', 'organizacoes', true)
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
        where id = 'organizacoes'
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
        where id = 'organizacoes'
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists organizacoes_storage_select_autenticados on storage.objects;
    drop policy if exists organizacoes_storage_insert_catalogo on storage.objects;

    create policy organizacoes_storage_select_autenticados
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'organizacoes'
        and auth.uid() is not null
      );

    create policy organizacoes_storage_insert_catalogo
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'organizacoes'
        and public.usuario_catalogo_chamados_ativo()
        and name like 'organizacoes/%'
      );
  end if;
end $$;
