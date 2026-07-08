create table if not exists public.calendarios_atendimento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null,
  descricao text null,
  tipo text not null default 'padrao',
  fuso_horario text not null default 'America/Fortaleza',
  atendimento_feriados boolean not null default false,
  necessita_agendamento boolean not null default false,
  ativo boolean not null default true,
  padrao_global boolean not null default false,
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint calendarios_atendimento_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint calendarios_atendimento_codigo_nao_vazio_check check (btrim(codigo) <> ''),
  constraint calendarios_atendimento_tipo_check check (tipo in ('padrao', 'especifico', 'excecao')),
  constraint calendarios_atendimento_codigo_unique unique (codigo)
);

create unique index if not exists calendarios_atendimento_um_padrao_global_ativo_idx
  on public.calendarios_atendimento (padrao_global)
  where padrao_global = true and ativo = true;

create table if not exists public.calendarios_atendimento_horarios (
  id uuid primary key default gen_random_uuid(),
  calendario_atendimento_id uuid not null references public.calendarios_atendimento(id) on delete cascade,
  dia_semana smallint not null,
  fechado boolean not null default false,
  abre_as time null,
  fecha_as time null,
  ordem smallint not null default 1,
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint calendarios_atendimento_horarios_dia_semana_check check (dia_semana between 0 and 6),
  constraint calendarios_atendimento_horarios_ordem_check check (ordem > 0),
  constraint calendarios_atendimento_horarios_dia_ordem_unique unique (
    calendario_atendimento_id,
    dia_semana,
    ordem
  ),
  constraint calendarios_atendimento_horario_valido_check check (
    (
      fechado = true
      and abre_as is null
      and fecha_as is null
    )
    or (
      fechado = false
      and abre_as is not null
      and fecha_as is not null
      and fecha_as > abre_as
    )
  )
);

alter table public.parceiros
  add column if not exists calendario_atendimento_id uuid null
  references public.calendarios_atendimento(id) on delete set null;

create index if not exists calendarios_atendimento_ativo_idx
  on public.calendarios_atendimento (ativo);
create index if not exists calendarios_atendimento_codigo_idx
  on public.calendarios_atendimento (codigo);
create index if not exists calendarios_atendimento_horarios_calendario_idx
  on public.calendarios_atendimento_horarios (calendario_atendimento_id);
create index if not exists calendarios_atendimento_horarios_dia_ordem_idx
  on public.calendarios_atendimento_horarios (
    calendario_atendimento_id,
    dia_semana,
    ordem
  );
create index if not exists parceiros_calendario_atendimento_id_idx
  on public.parceiros (calendario_atendimento_id);

drop trigger if exists trg_calendarios_atendimento_updated_at on public.calendarios_atendimento;
create trigger trg_calendarios_atendimento_updated_at
  before update on public.calendarios_atendimento
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_calendarios_atendimento_horarios_updated_at on public.calendarios_atendimento_horarios;
create trigger trg_calendarios_atendimento_horarios_updated_at
  before update on public.calendarios_atendimento_horarios
  for each row execute function public.atualizar_atualizado_em();

alter table public.calendarios_atendimento enable row level security;
alter table public.calendarios_atendimento_horarios enable row level security;

grant select, insert, update on table public.calendarios_atendimento to authenticated;
grant select, insert, update on table public.calendarios_atendimento_horarios to authenticated;
grant references on table public.calendarios_atendimento to authenticated;

revoke all on table public.calendarios_atendimento from anon;
revoke all on table public.calendarios_atendimento_horarios from anon;
revoke delete on table public.calendarios_atendimento from authenticated;
revoke delete on table public.calendarios_atendimento_horarios from authenticated;

drop policy if exists calendarios_atendimento_select_acesso on public.calendarios_atendimento;
create policy calendarios_atendimento_select_acesso
  on public.calendarios_atendimento
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists calendarios_atendimento_insert_catalogo on public.calendarios_atendimento;
create policy calendarios_atendimento_insert_catalogo
  on public.calendarios_atendimento
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists calendarios_atendimento_update_catalogo on public.calendarios_atendimento;
create policy calendarios_atendimento_update_catalogo
  on public.calendarios_atendimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists calendarios_atendimento_horarios_select_acesso on public.calendarios_atendimento_horarios;
create policy calendarios_atendimento_horarios_select_acesso
  on public.calendarios_atendimento_horarios
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists calendarios_atendimento_horarios_insert_catalogo on public.calendarios_atendimento_horarios;
create policy calendarios_atendimento_horarios_insert_catalogo
  on public.calendarios_atendimento_horarios
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists calendarios_atendimento_horarios_update_catalogo on public.calendarios_atendimento_horarios;
create policy calendarios_atendimento_horarios_update_catalogo
  on public.calendarios_atendimento_horarios
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

insert into public.calendarios_atendimento (
  nome,
  codigo,
  descricao,
  tipo,
  fuso_horario,
  atendimento_feriados,
  necessita_agendamento,
  ativo,
  padrao_global
)
values (
  'Comercial padrão',
  'comercial_padrao',
  'Calendário padrão para atendimento técnico em horário comercial.',
  'padrao',
  'America/Fortaleza',
  false,
  false,
  true,
  true
)
on conflict (codigo) do nothing;

insert into public.calendarios_atendimento_horarios (
  calendario_atendimento_id,
  dia_semana,
  fechado,
  abre_as,
  fecha_as,
  ordem
)
select calendario.id, horario.dia_semana, horario.fechado, horario.abre_as, horario.fecha_as, horario.ordem
from public.calendarios_atendimento calendario
cross join (
  values
    (0::smallint, true, null::time, null::time, 1::smallint),
    (1::smallint, false, '09:00'::time, '17:00'::time, 1::smallint),
    (2::smallint, false, '09:00'::time, '17:00'::time, 1::smallint),
    (3::smallint, false, '09:00'::time, '17:00'::time, 1::smallint),
    (4::smallint, false, '09:00'::time, '17:00'::time, 1::smallint),
    (5::smallint, false, '09:00'::time, '17:00'::time, 1::smallint),
    (6::smallint, true, null::time, null::time, 1::smallint)
) as horario(dia_semana, fechado, abre_as, fecha_as, ordem)
where calendario.codigo = 'comercial_padrao'
on conflict (calendario_atendimento_id, dia_semana, ordem) do nothing;

update public.parceiros
set calendario_atendimento_id = (
  select id
  from public.calendarios_atendimento
  where padrao_global = true
    and ativo = true
  order by criado_em
  limit 1
)
where calendario_atendimento_id is null;
