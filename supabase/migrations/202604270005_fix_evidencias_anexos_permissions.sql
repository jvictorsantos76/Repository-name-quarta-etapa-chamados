grant usage on schema public to authenticated;
grant select, insert, update on table public.evidencias_anexos to authenticated;

alter table public.evidencias_anexos enable row level security;

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

drop policy if exists dev_evidencias_anexos_select on public.evidencias_anexos;
drop policy if exists dev_evidencias_anexos_insert on public.evidencias_anexos;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidencias_anexos'
      and policyname = 'evidencias_anexos_select_operacionais'
  ) then
    create policy evidencias_anexos_select_operacionais
      on public.evidencias_anexos
      for select
      to authenticated
      using (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidencias_anexos'
      and policyname = 'evidencias_anexos_insert_operacionais'
  ) then
    create policy evidencias_anexos_insert_operacionais
      on public.evidencias_anexos
      for insert
      to authenticated
      with check (public.usuario_operacional_ativo());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidencias_anexos'
      and policyname = 'evidencias_anexos_update_operacionais'
  ) then
    create policy evidencias_anexos_update_operacionais
      on public.evidencias_anexos
      for update
      to authenticated
      using (public.usuario_operacional_ativo())
      with check (public.usuario_operacional_ativo());
  end if;
end $$;
