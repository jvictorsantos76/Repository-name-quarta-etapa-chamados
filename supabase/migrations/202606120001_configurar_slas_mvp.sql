create table if not exists public.calendarios_sla (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null,
  descricao text null,
  fuso_horario text not null default 'America/Fortaleza',
  regime_24x7 boolean not null default false,
  atendimento_feriados boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint calendarios_sla_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint calendarios_sla_codigo_nao_vazio_check check (btrim(codigo) <> ''),
  constraint calendarios_sla_codigo_unique unique (codigo)
);

create table if not exists public.calendarios_sla_horarios (
  id uuid primary key default gen_random_uuid(),
  calendario_sla_id uuid not null references public.calendarios_sla(id) on delete cascade,
  dia_semana smallint not null,
  fechado boolean not null default false,
  abre_as time null,
  fecha_as time null,
  ordem smallint not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint calendarios_sla_horarios_dia_semana_check check (dia_semana between 0 and 6),
  constraint calendarios_sla_horarios_ordem_check check (ordem > 0),
  constraint calendarios_sla_horarios_intervalo_check check (
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
  constraint calendarios_sla_horarios_dia_ordem_unique unique (
    calendario_sla_id,
    dia_semana,
    ordem
  )
);

create table if not exists public.slas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null,
  descricao text null,
  tipo text not null default 'padrao',
  calendario_sla_id uuid not null references public.calendarios_sla(id) on delete restrict,
  ativo boolean not null default true,
  observacoes_internas text null,
  versao_atual integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint slas_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint slas_codigo_nao_vazio_check check (btrim(codigo) <> ''),
  constraint slas_tipo_check check (tipo in ('padrao', 'contratual', 'especial')),
  constraint slas_versao_atual_check check (versao_atual > 0),
  constraint slas_codigo_unique unique (codigo)
);

create table if not exists public.sla_versoes (
  id uuid primary key default gen_random_uuid(),
  sla_id uuid not null references public.slas(id) on delete cascade,
  numero_versao integer not null,
  motivo text null,
  snapshot jsonb not null default '{}'::jsonb,
  vigente_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  constraint sla_versoes_numero_check check (numero_versao > 0),
  constraint sla_versoes_sla_numero_unique unique (sla_id, numero_versao)
);

create table if not exists public.sla_metas (
  id uuid primary key default gen_random_uuid(),
  sla_id uuid not null references public.slas(id) on delete cascade,
  meta_codigo text not null,
  prioridade public.prioridade_chamado not null,
  prazo_minutos integer not null,
  ativa boolean not null default true,
  considerar_calendario boolean not null default true,
  permitir_pausa boolean not null default false,
  usar_janela_cliente boolean not null default false,
  politica_fora_janela text not null default 'continuar_contagem',
  permitir_pausa_agendamento boolean not null default false,
  exigir_justificativa_pausa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint sla_metas_meta_codigo_check check (
    meta_codigo in (
      'primeira_resposta',
      'triagem',
      'inicio_remoto',
      'chegada_presencial',
      'resolucao',
      'atualizacao_periodica'
    )
  ),
  constraint sla_metas_prazo_minutos_check check (prazo_minutos > 0),
  constraint sla_metas_politica_fora_janela_check check (
    politica_fora_janela in (
      'continuar_contagem',
      'sugerir_proxima_janela',
      'permitir_pausa_manual',
      'pausar_apos_solicitacao_agendamento',
      'calcular_vencimento_na_proxima_janela'
    )
  ),
  constraint sla_metas_sla_meta_prioridade_unique unique (
    sla_id,
    meta_codigo,
    prioridade
  )
);

alter table public.parceiros
  add column if not exists sla_padrao_id uuid null references public.slas(id) on delete set null;

alter table public.parceiros_contratos
  add column if not exists sla_id uuid null references public.slas(id) on delete set null;

create index if not exists idx_calendarios_sla_ativo
  on public.calendarios_sla (ativo);
create index if not exists idx_calendarios_sla_horarios_calendario_dia
  on public.calendarios_sla_horarios (calendario_sla_id, dia_semana, ordem);
create index if not exists idx_slas_calendario_sla_id
  on public.slas (calendario_sla_id);
create index if not exists idx_slas_ativo
  on public.slas (ativo);
create index if not exists idx_sla_versoes_sla_id
  on public.sla_versoes (sla_id);
create index if not exists idx_sla_metas_sla_id
  on public.sla_metas (sla_id);
create index if not exists parceiros_sla_padrao_id_idx
  on public.parceiros (sla_padrao_id);
create index if not exists parceiros_contratos_sla_id_idx
  on public.parceiros_contratos (sla_id);

drop trigger if exists trg_calendarios_sla_updated_at on public.calendarios_sla;
create trigger trg_calendarios_sla_updated_at
  before update on public.calendarios_sla
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_calendarios_sla_horarios_updated_at on public.calendarios_sla_horarios;
create trigger trg_calendarios_sla_horarios_updated_at
  before update on public.calendarios_sla_horarios
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_slas_updated_at on public.slas;
create trigger trg_slas_updated_at
  before update on public.slas
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_sla_metas_updated_at on public.sla_metas;
create trigger trg_sla_metas_updated_at
  before update on public.sla_metas
  for each row execute function public.atualizar_atualizado_em();

alter table public.calendarios_sla enable row level security;
alter table public.calendarios_sla_horarios enable row level security;
alter table public.slas enable row level security;
alter table public.sla_versoes enable row level security;
alter table public.sla_metas enable row level security;

grant select, insert, update on table public.calendarios_sla to authenticated;
grant select, insert, update on table public.calendarios_sla_horarios to authenticated;
grant select, insert, update on table public.slas to authenticated;
grant select, insert on table public.sla_versoes to authenticated;
grant select, insert, update on table public.sla_metas to authenticated;
grant references on table public.calendarios_sla to authenticated;
grant references on table public.slas to authenticated;

grant select, insert, update, delete on table public.calendarios_sla to service_role;
grant select, insert, update, delete on table public.calendarios_sla_horarios to service_role;
grant select, insert, update, delete on table public.slas to service_role;
grant select, insert, update, delete on table public.sla_versoes to service_role;
grant select, insert, update, delete on table public.sla_metas to service_role;
grant references on table public.calendarios_sla to service_role;
grant references on table public.slas to service_role;

revoke all on table public.calendarios_sla from anon;
revoke all on table public.calendarios_sla_horarios from anon;
revoke all on table public.slas from anon;
revoke all on table public.sla_versoes from anon;
revoke all on table public.sla_metas from anon;
revoke delete on table public.calendarios_sla from authenticated;
revoke delete on table public.calendarios_sla_horarios from authenticated;
revoke delete on table public.slas from authenticated;
revoke delete on table public.sla_versoes from authenticated;
revoke delete on table public.sla_metas from authenticated;

drop policy if exists calendarios_sla_select_acesso on public.calendarios_sla;
create policy calendarios_sla_select_acesso
  on public.calendarios_sla
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists calendarios_sla_insert_catalogo on public.calendarios_sla;
create policy calendarios_sla_insert_catalogo
  on public.calendarios_sla
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists calendarios_sla_update_catalogo on public.calendarios_sla;
create policy calendarios_sla_update_catalogo
  on public.calendarios_sla
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists calendarios_sla_horarios_select_acesso on public.calendarios_sla_horarios;
create policy calendarios_sla_horarios_select_acesso
  on public.calendarios_sla_horarios
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists calendarios_sla_horarios_insert_catalogo on public.calendarios_sla_horarios;
create policy calendarios_sla_horarios_insert_catalogo
  on public.calendarios_sla_horarios
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists calendarios_sla_horarios_update_catalogo on public.calendarios_sla_horarios;
create policy calendarios_sla_horarios_update_catalogo
  on public.calendarios_sla_horarios
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists slas_select_acesso on public.slas;
create policy slas_select_acesso
  on public.slas
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists slas_insert_catalogo on public.slas;
create policy slas_insert_catalogo
  on public.slas
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists slas_update_catalogo on public.slas;
create policy slas_update_catalogo
  on public.slas
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists sla_versoes_select_acesso on public.sla_versoes;
create policy sla_versoes_select_acesso
  on public.sla_versoes
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists sla_versoes_insert_catalogo on public.sla_versoes;
create policy sla_versoes_insert_catalogo
  on public.sla_versoes
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists sla_metas_select_acesso on public.sla_metas;
create policy sla_metas_select_acesso
  on public.sla_metas
  for select
  to authenticated
  using (public.usuario_acesso_chamados_ativo());

drop policy if exists sla_metas_insert_catalogo on public.sla_metas;
create policy sla_metas_insert_catalogo
  on public.sla_metas
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists sla_metas_update_catalogo on public.sla_metas;
create policy sla_metas_update_catalogo
  on public.sla_metas
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());
