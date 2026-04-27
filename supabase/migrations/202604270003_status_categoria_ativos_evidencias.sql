alter table public.chamados
  add column if not exists categoria text,
  add column if not exists ativo_tipo text,
  add column if not exists ativo_descricao text,
  add column if not exists marca text,
  add column if not exists modelo text;

update public.chamados
set status = case status
  when 'aberto' then 'pendente_agendamento'
  when 'pendente' then 'pendente_agendamento'
  when 'finalizado' then 'resolvido'
  when 'concluido' then 'resolvido'
  else status
end
where status in ('aberto', 'pendente', 'finalizado', 'concluido');

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.chamados'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.chamados drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.chamados
  add constraint chamados_status_check
  check (
    status in (
      'pendente_agendamento',
      'orcamento',
      'agendado',
      'em_atendimento',
      'pendente_peca',
      'resolvido',
      'faturado'
    )
  );

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.chamados'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%categoria%'
  loop
    execute format(
      'alter table public.chamados drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.chamados
  add constraint chamados_categoria_check
  check (
    categoria is null
    or categoria in (
      'cabeamento',
      'cftv',
      'desktops',
      'pdvs',
      'automacao',
      'atendimento_interno',
      'impressoras_termicas',
      'impressoras'
    )
  );

insert into storage.buckets (id, name, public)
values ('evidencias-chamados', 'evidencias-chamados', true)
on conflict (id) do update set public = excluded.public;

alter table public.chamados enable row level security;
alter table public.historico_status enable row level security;
alter table public.evidencias_anexos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chamados'
      and policyname = 'dev_chamados_select'
  ) then
    create policy dev_chamados_select
      on public.chamados for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chamados'
      and policyname = 'dev_chamados_insert'
  ) then
    create policy dev_chamados_insert
      on public.chamados for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chamados'
      and policyname = 'dev_chamados_update'
  ) then
    create policy dev_chamados_update
      on public.chamados for update
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'historico_status'
      and policyname = 'dev_historico_status_insert'
  ) then
    create policy dev_historico_status_insert
      on public.historico_status for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'evidencias_anexos'
      and policyname = 'dev_evidencias_anexos_select'
  ) then
    create policy dev_evidencias_anexos_select
      on public.evidencias_anexos for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'evidencias_anexos'
      and policyname = 'dev_evidencias_anexos_insert'
  ) then
    create policy dev_evidencias_anexos_insert
      on public.evidencias_anexos for insert
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'dev_evidencias_storage_select'
  ) then
    create policy dev_evidencias_storage_select
      on storage.objects for select
      using (bucket_id = 'evidencias-chamados');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'dev_evidencias_storage_insert'
  ) then
    create policy dev_evidencias_storage_insert
      on storage.objects for insert
      with check (
        bucket_id = 'evidencias-chamados'
        and name like 'chamados/%'
      );
  end if;
end $$;
