grant usage on schema public to authenticated;

do $$
begin
  if to_regclass('public.evidencias_anexos') is not null then
    grant select, insert, update on table public.evidencias_anexos to authenticated;
    alter table public.evidencias_anexos enable row level security;
  end if;
end $$;

do $$
begin
  if to_regclass('public.perfis') is not null then
    create or replace function public.usuario_operacional_ativo()
    returns boolean
    language sql
    security definer
    set search_path = public
    as $function$
      select exists (
        select 1
        from public.perfis
        where id = auth.uid()
          and ativo = true
          and papel in ('admin', 'gestor', 'operador', 'analista', 'tecnico')
      );
    $function$;
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.usuario_operacional_ativo()') is not null then
    grant execute on function public.usuario_operacional_ativo() to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.evidencias_anexos') is not null then
    drop policy if exists dev_evidencias_anexos_select on public.evidencias_anexos;
    drop policy if exists dev_evidencias_anexos_insert on public.evidencias_anexos;
  end if;
end $$;

do $$
begin
  if to_regclass('public.evidencias_anexos') is not null
    and to_regprocedure('public.usuario_operacional_ativo()') is not null
    and not exists (
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

  if to_regclass('public.evidencias_anexos') is not null
    and to_regprocedure('public.usuario_operacional_ativo()') is not null
    and not exists (
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

  if to_regclass('public.evidencias_anexos') is not null
    and to_regprocedure('public.usuario_operacional_ativo()') is not null
    and not exists (
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
