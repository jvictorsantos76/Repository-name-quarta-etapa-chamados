update public.chamado_status
   set codigo = 'pendente_agendamento'
 where codigo = 'pendente_de_agendamento';

update public.chamados
   set status = 'pendente_agendamento'
 where status = 'pendente_de_agendamento';

update public.historico_status
   set status_anterior = 'pendente_agendamento'
 where status_anterior = 'pendente_de_agendamento';

update public.historico_status
   set status_novo = 'pendente_agendamento'
 where status_novo = 'pendente_de_agendamento';
