grant usage on schema public to authenticated;
grant select, insert, update on table public.evidencias_anexos to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.evidencias_anexos enable row level security;

drop policy if exists evidencias_anexos_select_operacionais on public.evidencias_anexos;
drop policy if exists evidencias_anexos_insert_operacionais on public.evidencias_anexos;
drop policy if exists evidencias_anexos_update_operacionais on public.evidencias_anexos;
drop policy if exists evidencias_anexos_select_autenticados on public.evidencias_anexos;
drop policy if exists evidencias_anexos_insert_autenticados on public.evidencias_anexos;
drop policy if exists evidencias_anexos_update_autenticados on public.evidencias_anexos;

create policy evidencias_anexos_select_autenticados
  on public.evidencias_anexos
  for select
  to authenticated
  using (auth.uid() is not null);

create policy evidencias_anexos_insert_autenticados
  on public.evidencias_anexos
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and usuario_id = auth.uid()
  );

create policy evidencias_anexos_update_autenticados
  on public.evidencias_anexos
  for update
  to authenticated
  using (
    auth.uid() is not null
    and usuario_id = auth.uid()
  )
  with check (
    auth.uid() is not null
    and usuario_id = auth.uid()
  );

drop policy if exists evidencias_storage_select_operacionais on storage.objects;
drop policy if exists evidencias_storage_insert_operacionais on storage.objects;
drop policy if exists evidencias_storage_select_autenticados on storage.objects;
drop policy if exists evidencias_storage_insert_autenticados on storage.objects;

create policy evidencias_storage_select_autenticados
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'evidencias-chamados'
    and auth.uid() is not null
  );

create policy evidencias_storage_insert_autenticados
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'evidencias-chamados'
    and name like 'chamados/%'
    and auth.uid() is not null
  );
