do $$
begin
  if to_regclass('public.chamados') is not null then
    alter table public.chamados
      drop constraint if exists chamados_status_check;

    alter table public.chamados
      add constraint chamados_status_check
      check (
        status in (
          'pendente_agendamento',
          'orcamento',
          'agendado',
          'analisado',
          'em_atendimento',
          'pendente_peca',
          'resolvido',
          'faturado',
          'arquivado'
        )
      );
  end if;

  if to_regclass('public.historico_status') is not null then
    alter table public.historico_status
      drop constraint if exists historico_status_status_anterior_check,
      drop constraint if exists historico_status_status_novo_check;

    alter table public.historico_status
      add constraint historico_status_status_anterior_check
      check (
        status_anterior is null
        or status_anterior in (
          'pendente_agendamento',
          'orcamento',
          'agendado',
          'analisado',
          'em_atendimento',
          'pendente_peca',
          'resolvido',
          'faturado',
          'arquivado'
        )
      ),
      add constraint historico_status_status_novo_check
      check (
        status_novo in (
          'pendente_agendamento',
          'orcamento',
          'agendado',
          'analisado',
          'em_atendimento',
          'pendente_peca',
          'resolvido',
          'faturado',
          'arquivado'
        )
      );
  end if;
end $$;
