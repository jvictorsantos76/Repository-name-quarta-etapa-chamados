alter table public.parceiros
  add column if not exists calendario_funcionamento_id uuid null
  references public.calendarios_sla(id) on delete set null;

create index if not exists parceiros_calendario_funcionamento_id_idx
  on public.parceiros (calendario_funcionamento_id);

update public.parceiros parceiro
set calendario_funcionamento_id = calendario_sla.id
from public.calendarios_atendimento calendario_atendimento
join public.calendarios_sla calendario_sla
  on lower(btrim(calendario_sla.codigo)) = lower(btrim(calendario_atendimento.codigo))
where parceiro.calendario_funcionamento_id is null
  and parceiro.calendario_atendimento_id = calendario_atendimento.id;
