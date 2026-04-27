alter table public.chamados
  add column if not exists categoria text,
  add column if not exists ativo_tipo text,
  add column if not exists ativo_descricao text,
  add column if not exists marca text,
  add column if not exists modelo text;

alter table public.chamados
  alter column status type text using status::text;

alter table public.historico_status
  alter column status_anterior type text using status_anterior::text,
  alter column status_novo type text using status_novo::text;

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

  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.historico_status'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.historico_status drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

update public.chamados
set status = case status
  when 'aberto' then 'pendente_agendamento'
  when 'pendente' then 'pendente_agendamento'
  when 'finalizado' then 'resolvido'
  when 'concluido' then 'resolvido'
  else status
end
where status in ('aberto', 'pendente', 'finalizado', 'concluido');

update public.historico_status
set
  status_anterior = case status_anterior
    when 'aberto' then 'pendente_agendamento'
    when 'pendente' then 'pendente_agendamento'
    when 'finalizado' then 'resolvido'
    when 'concluido' then 'resolvido'
    else status_anterior
  end,
  status_novo = case status_novo
    when 'aberto' then 'pendente_agendamento'
    when 'pendente' then 'pendente_agendamento'
    when 'finalizado' then 'resolvido'
    when 'concluido' then 'resolvido'
    else status_novo
  end
where status_anterior in ('aberto', 'pendente', 'finalizado', 'concluido')
   or status_novo in ('aberto', 'pendente', 'finalizado', 'concluido');

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

alter table public.historico_status
  add constraint historico_status_status_anterior_check
  check (
    status_anterior is null
    or status_anterior in (
      'pendente_agendamento',
      'orcamento',
      'agendado',
      'em_atendimento',
      'pendente_peca',
      'resolvido',
      'faturado'
    )
  ),
  add constraint historico_status_status_novo_check
  check (
    status_novo in (
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
