create table if not exists public.parceiro_horarios_atendimento (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  dia_semana smallint not null,
  fechado boolean not null default false,
  abre_as time null,
  fecha_as time null,
  ordem smallint not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiro_horarios_atendimento_dia_semana_check check (
    dia_semana between 0 and 6
  ),
  constraint parceiro_horarios_atendimento_ordem_check check (ordem > 0),
  constraint parceiro_horarios_atendimento_intervalo_check check (
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
  ),
  constraint parceiro_horarios_atendimento_dia_ordem_unique unique (
    parceiro_id,
    dia_semana,
    ordem
  )
);

create index if not exists idx_parceiro_horarios_atendimento_parceiro_id
  on public.parceiro_horarios_atendimento (parceiro_id);

create index if not exists idx_parceiro_horarios_atendimento_parceiro_dia
  on public.parceiro_horarios_atendimento (parceiro_id, dia_semana, ordem);

drop trigger if exists trg_parceiro_horarios_atendimento_updated_at
  on public.parceiro_horarios_atendimento;
create trigger trg_parceiro_horarios_atendimento_updated_at
  before update on public.parceiro_horarios_atendimento
  for each row execute function public.atualizar_atualizado_em();

alter table public.parceiro_horarios_atendimento enable row level security;

grant select, insert, update on table public.parceiro_horarios_atendimento to authenticated;
grant select, insert, update, delete on table public.parceiro_horarios_atendimento to service_role;
grant references on table public.parceiro_horarios_atendimento to authenticated;

revoke all on table public.parceiro_horarios_atendimento from anon;
revoke delete on table public.parceiro_horarios_atendimento from authenticated;

drop policy if exists parceiro_horarios_atendimento_select_acesso
  on public.parceiro_horarios_atendimento;
create policy parceiro_horarios_atendimento_select_acesso
  on public.parceiro_horarios_atendimento
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or exists (
      select 1
      from public.parceiros p
      where p.id = parceiro_id
        and p.ativo = true
        and public.usuario_acesso_chamados_ativo()
    )
  );

drop policy if exists parceiro_horarios_atendimento_insert_catalogo
  on public.parceiro_horarios_atendimento;
create policy parceiro_horarios_atendimento_insert_catalogo
  on public.parceiro_horarios_atendimento
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists parceiro_horarios_atendimento_update_catalogo
  on public.parceiro_horarios_atendimento;
create policy parceiro_horarios_atendimento_update_catalogo
  on public.parceiro_horarios_atendimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());
