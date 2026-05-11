alter type public.papel_usuario add value if not exists 'super_admin';
alter type public.papel_usuario add value if not exists 'cliente';
alter type public.papel_usuario add value if not exists 'solicitante';

alter table if exists public.solicitacoes_acesso
  add column if not exists user_id uuid null,
  add column if not exists email_confirmado_em timestamptz null,
  add column if not exists criado_em timestamptz null,
  add column if not exists expira_em timestamptz null,
  add column if not exists motivo_rejeicao text null,
  add column if not exists bloqueado_em timestamptz null,
  add column if not exists cliente_id uuid null,
  add column if not exists loja_id uuid null;

update public.solicitacoes_acesso
set criado_em = coalesce(criado_em, created_at, now())
where criado_em is null;

update public.solicitacoes_acesso
set user_id = coalesce(user_id, auth_user_id, perfil_id)
where user_id is null
  and coalesce(auth_user_id, perfil_id) is not null;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null then
    alter table public.solicitacoes_acesso
      add constraint solicitacoes_acesso_user_id_fkey
      foreign key (user_id) references auth.users(id);
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null
    and to_regclass('public.clientes') is not null then
    alter table public.solicitacoes_acesso
      add constraint solicitacoes_acesso_cliente_id_fkey
      foreign key (cliente_id) references public.clientes(id);
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null
    and to_regclass('public.lojas') is not null then
    alter table public.solicitacoes_acesso
      add constraint solicitacoes_acesso_loja_id_fkey
      foreign key (loja_id) references public.lojas(id);
  end if;
exception
  when duplicate_object then null;
end $$;

alter table if exists public.solicitacoes_acesso
  drop constraint if exists solicitacoes_acesso_status_check;

alter table if exists public.solicitacoes_acesso
  add constraint solicitacoes_acesso_status_check
  check (
    status in (
      'pendente_confirmacao_email',
      'pendente_aprovacao',
      'aprovado',
      'rejeitado',
      'expirado',
      'cancelado'
    )
  );

alter table if exists public.solicitacoes_acesso
  alter column status set default 'pendente_confirmacao_email';

create index if not exists solicitacoes_acesso_user_id_idx
  on public.solicitacoes_acesso (user_id)
  where user_id is not null;

create index if not exists solicitacoes_acesso_status_idx
  on public.solicitacoes_acesso (status);

create index if not exists solicitacoes_acesso_criado_em_idx
  on public.solicitacoes_acesso (criado_em);

create index if not exists solicitacoes_acesso_expira_em_idx
  on public.solicitacoes_acesso (expira_em)
  where expira_em is not null;

drop index if exists public.solicitacoes_acesso_email_pendente_idx;
create unique index if not exists solicitacoes_acesso_email_aberta_idx
  on public.solicitacoes_acesso (lower(email))
  where status in ('pendente_confirmacao_email', 'pendente_aprovacao');

create or replace function public.calcular_expiracao_horas_uteis(
  inicio timestamptz,
  horas_uteis integer
)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  cursor_hora timestamptz := date_trunc('hour', coalesce(inicio, now()));
  horas_contadas integer := 0;
begin
  -- Regra inicial: segunda a sexta, sem calendário de feriados cadastrado.
  while horas_contadas < horas_uteis loop
    cursor_hora := cursor_hora + interval '1 hour';
    if extract(isodow from cursor_hora) between 1 and 5 then
      horas_contadas := horas_contadas + 1;
    end if;
  end loop;

  return cursor_hora;
end;
$$;

create or replace function public.usuario_admin_usuarios_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
      and papel::text in ('super_admin', 'admin')
  );
$$;

create or replace function public.usuario_admin_ou_gestor_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
      and papel::text in ('super_admin', 'admin', 'gestor')
  );
$$;

create or replace function public.usuario_operacional_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
      and papel::text in ('super_admin', 'admin', 'gestor', 'operador', 'analista', 'tecnico', 'cliente')
  );
$$;

create or replace function public.usuario_solicitacao_pendente_ativa()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.solicitacoes_acesso s
    where coalesce(s.user_id, s.auth_user_id, s.perfil_id) = auth.uid()
      and s.status = 'pendente_aprovacao'
      and s.email_confirmado_em is not null
      and s.expira_em > now()
      and s.bloqueado_em is null
  );
$$;

create or replace function public.usuario_acesso_chamados_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.usuario_operacional_ativo()
    or public.usuario_solicitacao_pendente_ativa();
$$;

grant execute on function public.calcular_expiracao_horas_uteis(timestamptz, integer) to authenticated, service_role;
grant execute on function public.usuario_admin_usuarios_ativo() to authenticated;
grant execute on function public.usuario_admin_ou_gestor_ativo() to authenticated;
grant execute on function public.usuario_operacional_ativo() to authenticated;
grant execute on function public.usuario_solicitacao_pendente_ativa() to authenticated;
grant execute on function public.usuario_acesso_chamados_ativo() to authenticated;

grant select on table public.solicitacoes_acesso to authenticated;
grant update on table public.solicitacoes_acesso to authenticated;
grant insert on table public.solicitacoes_acesso to anon;
grant insert on table public.aceites_legais to anon;
grant select on table public.clientes to authenticated;
grant select on table public.lojas to authenticated;
grant select, insert, update on table public.chamados to authenticated;
grant select, insert on table public.historico_status to authenticated;
grant select, insert on table public.registros_tecnicos to authenticated;
grant select, insert, update on table public.evidencias_anexos to authenticated;

drop policy if exists dev_select_chamados on public.chamados;
drop policy if exists dev_insert_chamados on public.chamados;
drop policy if exists dev_update_chamados on public.chamados;
drop policy if exists dev_select_clientes on public.clientes;
drop policy if exists dev_select_lojas on public.lojas;
drop policy if exists dev_select_historico_status on public.historico_status;
drop policy if exists dev_insert_historico_status on public.historico_status;
drop policy if exists dev_select_registros_tecnicos on public.registros_tecnicos;
drop policy if exists dev_insert_registros_tecnicos on public.registros_tecnicos;
drop policy if exists dev_select_evidencias_anexos on public.evidencias_anexos;

drop policy if exists solicitacoes_acesso_insert_publico on public.solicitacoes_acesso;
create policy solicitacoes_acesso_insert_publico
  on public.solicitacoes_acesso
  for insert
  to anon
  with check (
    status = 'pendente_confirmacao_email'
    and aceite_termos = true
    and aceite_privacidade = true
    and nome_completo <> ''
    and email <> ''
    and empresa <> ''
  );

drop policy if exists solicitacoes_acesso_select_propria on public.solicitacoes_acesso;
create policy solicitacoes_acesso_select_propria
  on public.solicitacoes_acesso
  for select
  to authenticated
  using (coalesce(user_id, auth_user_id, perfil_id) = auth.uid());

drop policy if exists solicitacoes_acesso_select_admin_gestor on public.solicitacoes_acesso;
drop policy if exists solicitacoes_acesso_select_admin on public.solicitacoes_acesso;
create policy solicitacoes_acesso_select_admin
  on public.solicitacoes_acesso
  for select
  to authenticated
  using (public.usuario_admin_usuarios_ativo());

drop policy if exists solicitacoes_acesso_update_admin_gestor on public.solicitacoes_acesso;
drop policy if exists solicitacoes_acesso_update_admin on public.solicitacoes_acesso;
create policy solicitacoes_acesso_update_admin
  on public.solicitacoes_acesso
  for update
  to authenticated
  using (public.usuario_admin_usuarios_ativo())
  with check (
    public.usuario_admin_usuarios_ativo()
    and status in (
      'pendente_confirmacao_email',
      'pendente_aprovacao',
      'aprovado',
      'rejeitado',
      'expirado',
      'cancelado'
    )
  );

drop policy if exists perfis_select_operacionais on public.perfis;
drop policy if exists perfis_select_autorizados on public.perfis;
create policy perfis_select_autorizados
  on public.perfis
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.usuario_operacional_ativo()
  );

drop policy if exists clientes_select_operacionais on public.clientes;
drop policy if exists clientes_select_por_acesso on public.clientes;
create policy clientes_select_por_acesso
  on public.clientes
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
      from public.solicitacoes_acesso s
      where coalesce(s.user_id, s.auth_user_id, s.perfil_id) = auth.uid()
        and s.status = 'pendente_aprovacao'
        and s.email_confirmado_em is not null
        and s.expira_em > now()
        and s.bloqueado_em is null
        and s.cliente_id = clientes.id
    )
  );

drop policy if exists lojas_select_operacionais on public.lojas;
drop policy if exists lojas_select_por_acesso on public.lojas;
create policy lojas_select_por_acesso
  on public.lojas
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
      from public.solicitacoes_acesso s
      where coalesce(s.user_id, s.auth_user_id, s.perfil_id) = auth.uid()
        and s.status = 'pendente_aprovacao'
        and s.email_confirmado_em is not null
        and s.expira_em > now()
        and s.bloqueado_em is null
        and s.loja_id = lojas.id
    )
  );

drop policy if exists chamados_select_operacionais on public.chamados;
drop policy if exists chamados_select_por_acesso on public.chamados;
create policy chamados_select_por_acesso
  on public.chamados
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or (
      public.usuario_solicitacao_pendente_ativa()
      and operador_id = auth.uid()
    )
  );

drop policy if exists chamados_insert_operacionais on public.chamados;
drop policy if exists chamados_insert_por_acesso on public.chamados;
create policy chamados_insert_por_acesso
  on public.chamados
  for insert
  to authenticated
  with check (
    operador_id = auth.uid()
    and (
      public.usuario_operacional_ativo()
      or (
        public.usuario_solicitacao_pendente_ativa()
        and tecnico_id is null
        and analista_responsavel_id is null
        and tecnico_responsavel_id is null
        and exists (
          select 1
          from public.solicitacoes_acesso s
          where coalesce(s.user_id, s.auth_user_id, s.perfil_id) = auth.uid()
            and s.status = 'pendente_aprovacao'
            and s.email_confirmado_em is not null
            and s.expira_em > now()
            and s.bloqueado_em is null
            and s.cliente_id = chamados.cliente_id
            and s.loja_id = chamados.loja_id
        )
      )
    )
  );

drop policy if exists chamados_update_operacionais on public.chamados;
create policy chamados_update_operacionais
  on public.chamados
  for update
  to authenticated
  using (public.usuario_operacional_ativo())
  with check (public.usuario_operacional_ativo());

drop policy if exists historico_status_select_operacionais on public.historico_status;
drop policy if exists historico_status_select_por_acesso on public.historico_status;
create policy historico_status_select_por_acesso
  on public.historico_status
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
      from public.chamados c
      where c.id = historico_status.chamado_id
        and c.operador_id = auth.uid()
        and public.usuario_solicitacao_pendente_ativa()
    )
  );

drop policy if exists historico_status_insert_operacionais on public.historico_status;
drop policy if exists historico_status_insert_por_acesso on public.historico_status;
create policy historico_status_insert_por_acesso
  on public.historico_status
  for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and (
      public.usuario_operacional_ativo()
      or (
        public.usuario_solicitacao_pendente_ativa()
        and exists (
          select 1
          from public.chamados c
          where c.id = historico_status.chamado_id
            and c.operador_id = auth.uid()
        )
      )
    )
  );

drop policy if exists registros_tecnicos_select_operacionais on public.registros_tecnicos;
create policy registros_tecnicos_select_operacionais
  on public.registros_tecnicos
  for select
  to authenticated
  using (public.usuario_operacional_ativo());

drop policy if exists registros_tecnicos_insert_operacionais on public.registros_tecnicos;
create policy registros_tecnicos_insert_operacionais
  on public.registros_tecnicos
  for insert
  to authenticated
  with check (public.usuario_operacional_ativo() and tecnico_id = auth.uid());

drop policy if exists evidencias_anexos_select_autenticados on public.evidencias_anexos;
drop policy if exists evidencias_anexos_select_por_acesso on public.evidencias_anexos;
create policy evidencias_anexos_select_por_acesso
  on public.evidencias_anexos
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
      from public.chamados c
      where c.id = evidencias_anexos.chamado_id
        and c.operador_id = auth.uid()
        and public.usuario_solicitacao_pendente_ativa()
    )
  );

drop policy if exists evidencias_anexos_insert_autenticados on public.evidencias_anexos;
drop policy if exists evidencias_anexos_insert_por_acesso on public.evidencias_anexos;
create policy evidencias_anexos_insert_por_acesso
  on public.evidencias_anexos
  for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and (
      public.usuario_operacional_ativo()
      or (
        public.usuario_solicitacao_pendente_ativa()
        and exists (
          select 1
          from public.chamados c
          where c.id = evidencias_anexos.chamado_id
            and c.operador_id = auth.uid()
        )
      )
    )
  );

drop policy if exists evidencias_anexos_update_autenticados on public.evidencias_anexos;
drop policy if exists evidencias_anexos_update_operacionais on public.evidencias_anexos;
create policy evidencias_anexos_update_operacionais
  on public.evidencias_anexos
  for update
  to authenticated
  using (public.usuario_operacional_ativo() and usuario_id = auth.uid())
  with check (public.usuario_operacional_ativo() and usuario_id = auth.uid());

drop policy if exists chamado_tipos_select_ativos on public.chamado_tipos;
create policy chamado_tipos_select_ativos
  on public.chamado_tipos
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists chamado_origens_select_ativos on public.chamado_origens;
create policy chamado_origens_select_ativos
  on public.chamado_origens
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists grupos_atendimento_select_ativos on public.grupos_atendimento;
create policy grupos_atendimento_select_ativos
  on public.grupos_atendimento
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists bases_conhecimento_select_ativos on public.bases_conhecimento;
create policy bases_conhecimento_select_ativos
  on public.bases_conhecimento
  for select
  to authenticated
  using (ativo = true and public.usuario_operacional_ativo());
