alter table if exists public.chamados
  add column if not exists categoria text,
  add column if not exists ativo_tipo text,
  add column if not exists ativo_descricao text,
  add column if not exists marca text,
  add column if not exists modelo text;

do $$
declare
  constraint_record record;
begin
  if to_regclass('public.chamados') is not null then
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
  end if;

  if to_regclass('public.historico_status') is not null then
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
  end if;
end $$;

do $$
begin
  if to_regclass('public.chamados') is not null then
    alter table public.chamados
      alter column status drop default,
      alter column status type text using status::text;

    update public.chamados
    set status = case status
      when 'aberto' then 'pendente_agendamento'
      when 'pendente' then 'pendente_agendamento'
      when 'atribuido' then 'agendado'
      when 'finalizado' then 'resolvido'
      when 'concluido' then 'resolvido'
      when 'cancelado' then 'resolvido'
      else status
    end
    where status in ('aberto', 'pendente', 'atribuido', 'finalizado', 'concluido', 'cancelado');

    update public.chamados
    set status = 'pendente_agendamento'
    where status is null
       or status not in (
        'pendente_agendamento',
        'orcamento',
        'agendado',
        'em_atendimento',
        'pendente_peca',
        'resolvido',
        'faturado'
      );

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

    alter table public.chamados
      alter column status set default 'pendente_agendamento';
  end if;

  if to_regclass('public.historico_status') is not null then
    alter table public.historico_status
      alter column status_anterior drop default,
      alter column status_novo drop default,
      alter column status_anterior type text using status_anterior::text,
      alter column status_novo type text using status_novo::text;

    update public.historico_status
    set
      status_anterior = case status_anterior
        when 'aberto' then 'pendente_agendamento'
        when 'pendente' then 'pendente_agendamento'
        when 'atribuido' then 'agendado'
        when 'finalizado' then 'resolvido'
        when 'concluido' then 'resolvido'
        when 'cancelado' then 'resolvido'
        else status_anterior
      end,
      status_novo = case status_novo
        when 'aberto' then 'pendente_agendamento'
        when 'pendente' then 'pendente_agendamento'
        when 'atribuido' then 'agendado'
        when 'finalizado' then 'resolvido'
        when 'concluido' then 'resolvido'
        when 'cancelado' then 'resolvido'
        else status_novo
      end
    where status_anterior in ('aberto', 'pendente', 'atribuido', 'finalizado', 'concluido', 'cancelado')
       or status_novo in ('aberto', 'pendente', 'atribuido', 'finalizado', 'concluido', 'cancelado');

    update public.historico_status
    set status_anterior = 'pendente_agendamento'
    where status_anterior is not null
      and status_anterior not in (
        'pendente_agendamento',
        'orcamento',
        'agendado',
        'em_atendimento',
        'pendente_peca',
        'resolvido',
        'faturado'
      );

    update public.historico_status
    set status_novo = 'pendente_agendamento'
    where status_novo is null
       or status_novo not in (
        'pendente_agendamento',
        'orcamento',
        'agendado',
        'em_atendimento',
        'pendente_peca',
        'resolvido',
        'faturado'
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
  end if;
end $$;

do $$
declare
  constraint_record record;
begin
  if to_regclass('public.chamados') is not null then
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
  end if;
end $$;

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('evidencias-chamados', 'evidencias-chamados', true)
    on conflict (id) do update set public = excluded.public;
  end if;
end $$;
