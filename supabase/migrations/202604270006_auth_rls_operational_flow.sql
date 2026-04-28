grant usage on schema public to authenticated;

grant select on table public.clientes to authenticated;
grant select on table public.lojas to authenticated;
grant select on table public.perfis to authenticated;
grant select, insert, update on table public.chamados to authenticated;
grant select, insert on table public.historico_status to authenticated;
grant select, insert, update on table public.evidencias_anexos to authenticated;
grant select, insert on table public.registros_tecnicos to authenticated;

alter table public.clientes enable row level security;
alter table public.lojas enable row level security;
alter table public.perfis enable row level security;
alter table public.chamados enable row level security;
alter table public.historico_status enable row level security;
alter table public.evidencias_anexos enable row level security;
alter table public.registros_tecnicos enable row level security;

create or replace function public.usuario_operacional_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
      and papel in ('admin', 'gestor', 'operador', 'analista', 'tecnico')
  );
$$;

grant execute on function public.usuario_operacional_ativo() to authenticated;

drop policy if exists dev_chamados_select on public.chamados;
drop policy if exists dev_chamados_insert on public.chamados;
drop policy if exists dev_chamados_update on public.chamados;
drop policy if exists dev_historico_status_insert on public.historico_status;
drop policy if exists dev_evidencias_storage_select on storage.objects;
drop policy if exists dev_evidencias_storage_insert on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clientes'
      and policyname = 'clientes_select_operacionais'
  ) then
    create policy clientes_select_operacionais
      on public.clientes
      for select
      to authenticated
      using (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lojas'
      and policyname = 'lojas_select_operacionais'
  ) then
    create policy lojas_select_operacionais
      on public.lojas
      for select
      to authenticated
      using (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'perfis'
      and policyname = 'perfis_select_operacionais'
  ) then
    create policy perfis_select_operacionais
      on public.perfis
      for select
      to authenticated
      using (
        id = auth.uid()
        or public.usuario_operacional_ativo()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chamados'
      and policyname = 'chamados_select_operacionais'
  ) then
    create policy chamados_select_operacionais
      on public.chamados
      for select
      to authenticated
      using (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chamados'
      and policyname = 'chamados_insert_operacionais'
  ) then
    create policy chamados_insert_operacionais
      on public.chamados
      for insert
      to authenticated
      with check (
        public.usuario_operacional_ativo()
        and operador_id = auth.uid()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chamados'
      and policyname = 'chamados_update_operacionais'
  ) then
    create policy chamados_update_operacionais
      on public.chamados
      for update
      to authenticated
      using (public.usuario_operacional_ativo())
      with check (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'historico_status'
      and policyname = 'historico_status_select_operacionais'
  ) then
    create policy historico_status_select_operacionais
      on public.historico_status
      for select
      to authenticated
      using (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'historico_status'
      and policyname = 'historico_status_insert_operacionais'
  ) then
    create policy historico_status_insert_operacionais
      on public.historico_status
      for insert
      to authenticated
      with check (
        public.usuario_operacional_ativo()
        and usuario_id = auth.uid()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'registros_tecnicos'
      and policyname = 'registros_tecnicos_select_operacionais'
  ) then
    create policy registros_tecnicos_select_operacionais
      on public.registros_tecnicos
      for select
      to authenticated
      using (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'registros_tecnicos'
      and policyname = 'registros_tecnicos_insert_operacionais'
  ) then
    create policy registros_tecnicos_insert_operacionais
      on public.registros_tecnicos
      for insert
      to authenticated
      with check (
        public.usuario_operacional_ativo()
        and tecnico_id = auth.uid()
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'evidencias_storage_select_operacionais'
  ) then
    create policy evidencias_storage_select_operacionais
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'evidencias-chamados'
        and public.usuario_operacional_ativo()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'evidencias_storage_insert_operacionais'
  ) then
    create policy evidencias_storage_insert_operacionais
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'evidencias-chamados'
        and name like 'chamados/%'
        and public.usuario_operacional_ativo()
      );
  end if;
end $$;
